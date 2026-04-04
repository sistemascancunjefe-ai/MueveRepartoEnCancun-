/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { openDB } from 'idb';
import { getWalletBalance, __resetDBPromise, setWalletBalance, initDB, updateWalletBalance } from '../utils/db';

// Mock the idb library
vi.mock('idb', () => {
  const stores: any = {
    'routes': {},
    'user-reports': {},
    'wallet-status': {},
    'internal-settings': {}
  };

  const mockTx = {
    objectStore: (name: string) => ({
      get: async (key: string) => stores[name][key],
      put: async (val: any, key: string) => { stores[name][key] = val; },
    }),
    done: Promise.resolve(),
  };

  const mockDb = {
    transaction: (_storeNames: string | string[], _mode?: string) => mockTx,
    get: async (storeName: string, key: string) => stores[storeName][key],
    put: async (storeName: string, val: any, key: string) => { stores[storeName][key] = val; },
    objectStoreNames: {
        contains: (name: string) => !!stores[name]
    },
    createObjectStore: (name: string) => {
        if (!stores[name]) stores[name] = {};
        return {
            createIndex: vi.fn()
        };
    },
    // A helper method on the mock to let us bypass the SDK and directly tamper
    _tamperStore: (storeName: string, key: string, val: any) => { stores[storeName][key] = val; },
    _clearStore: () => {
        Object.keys(stores).forEach(k => stores[k] = {});
    }
  };

  return {
    openDB: vi.fn().mockImplementation(async (name, version, options) => {
        if (options?.upgrade) {
            options.upgrade(mockDb, 0, version);
        }
        return mockDb;
    }),
  };
});

// Since we use Web Crypto API, we need to ensure it's available in the test environment.
// Node 20+ has crypto.subtle on globalThis.
import { webcrypto } from 'crypto';
const originalLocalStorage = (globalThis as any).localStorage;
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}


// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
globalThis.localStorage = localStorageMock as any;

afterAll(() => {
  // Only restore localStorage, which we replaced with a mock.
  // globalThis.crypto is not restored because we only polyfill it when absent;
  // in Node 20+ it is already defined and read-only, so nothing was changed.
  (globalThis as any).localStorage = originalLocalStorage;
});

describe('DB Security Checks', () => {

  beforeEach(async () => {
    __resetDBPromise();
    // We clear the mock store before each test
    const db = await openDB('cancunmueve-db', 4);
    // @ts-ignore
    db._clearStore();

    // Simulate migration already done to prevent auto-signing loophole
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'balance_migration_done') return 'true';
      return null;
    });
  });


  it('should generate and verify a valid signature on setWalletBalance', async () => {
    await setWalletBalance(100.00);
    const balance = await getWalletBalance();

    expect(balance).toBeDefined();
    expect(balance?.amount).toBe(100.00);
    expect(balance?.signature).toBeDefined();
    expect(typeof balance?.signature).toBe('string');
  });

  it('should reset balance to 0 if amount is tampered with', async () => {
    // 1. Set legitimate balance
    await setWalletBalance(50.00);

    // 2. Tamper with the store directly (bypassing the signature generation)
    const db = await openDB('cancunmueve-db', 4);
    // @ts-ignore
    const existing = await db.get('wallet-status', 'current_balance');

    // User tries to artificially inflate balance to 9999
    existing.amount = 9999.00;
    // @ts-ignore
    db._tamperStore('wallet-status', 'current_balance', existing);

    // 3. Read it back via the API, it should detect tampering and reset to 0
    const tamperedBalance = await getWalletBalance();

    expect(tamperedBalance).toBeDefined();
    expect(tamperedBalance?.amount).toBe(0.00); // Punished!
  });

  it('should treat a missing signature as a legacy record and backfill it', async () => {
    await setWalletBalance(75.00);

    const db = await openDB('cancunmueve-db', 4);
    // @ts-ignore
    const existing = await db.get('wallet-status', 'current_balance');

    // Simulate a legacy record: remove its signature
    delete existing.signature;
    // @ts-ignore
    db._tamperStore('wallet-status', 'current_balance', existing);

    const result = await getWalletBalance();

    // Balance should be preserved (treated as legacy state, not tampering)
    expect(result?.amount).toBe(75.00);
    expect(result?.signature).toBeDefined();
  });

  it('should correctly handle updates and sign the new balance', async () => {
    await setWalletBalance(100.00);
    await updateWalletBalance(50.00); // Recharging $50

    const finalBalance = await getWalletBalance();
    expect(finalBalance?.amount).toBe(150.00);
    expect(finalBalance?.signature).toBeDefined();
  });

  it('should initialize a fresh profile with default 180.00 MXN balance and a valid signature', async () => {
    // Simulate a fresh profile: no migration done and no localStorage values
    localStorageMock.getItem.mockImplementation((_key) => null);

    __resetDBPromise();
    await initDB();

    const balance = await getWalletBalance();
    expect(balance).toBeDefined();
    expect(balance?.amount).toBe(180.00);
    expect(balance?.signature).toBeDefined();
  });

  it('should migrate signatures from legacy hardcoded salt', async () => {
    const LEGACY_SALT = "cancunmueve_wallet_secure_salt_v1";
    const enc = new TextEncoder();
    const keyMaterial = enc.encode(LEGACY_SALT);
    const legacyKey = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const amount = 300.00;
    const data = enc.encode(amount.toFixed(2));
    const signatureBuffer = await crypto.subtle.sign("HMAC", legacyKey, data);
    const legacySignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const db = await openDB('cancunmueve-db', 4);
    // @ts-ignore
    db._tamperStore('wallet-status', 'current_balance', { id: 'current_balance', amount, currency: 'MXN', signature: legacySignature });

    // Should detect legacy and upgrade
    const balance = await getWalletBalance();
    expect(balance?.amount).toBe(300.00);
    expect(balance?.signature).not.toBe(legacySignature);
  });
});
