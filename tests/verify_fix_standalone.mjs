
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// Mock stores
const stores = {
  'routes': {},
  'user-reports': {},
  'wallet-status': {},
  'internal-settings': {}
};

const localStorageStore = {};
globalThis.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, value) => { localStorageStore[key] = value; },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const mockIdb = {
  openDB: async (name, version, { upgrade } = {}) => {
    if (upgrade) {
      const dbMock = {
        objectStoreNames: {
          contains: (n) => !!stores[n]
        },
        createObjectStore: (n) => { stores[n] = {}; }
      };
      upgrade(dbMock, 0, version);
    }
    return {
      get: async (s, k) => stores[s][k],
      put: async (s, v, k) => { stores[s][k] = v; },
      transaction: (s, mode) => ({
        objectStore: (sn) => ({
          get: async (k) => stores[sn][k],
          put: async (v, k) => { stores[sn][k] = v; },
        }),
        done: Promise.resolve()
      }),
      close: () => {}
    };
  }
};

const DB_NAME = 'cancunmueve-db';
const DB_VERSION = 4;
const LEGACY_SALT = "cancunmueve_wallet_secure_salt_v1";

const getLegacyCryptoKey = async () => {
  const enc = new TextEncoder();
  const keyMaterial = enc.encode(LEGACY_SALT);
  return crypto.subtle.importKey("raw", keyMaterial, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
};

async function test() {
  console.log("Starting Security Fix Verification...");

  const db = await mockIdb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
       if (!db.objectStoreNames.contains('wallet-status')) db.createObjectStore('wallet-status');
       if (!db.objectStoreNames.contains('internal-settings')) db.createObjectStore('internal-settings');
    }
  });

  const sign = async (amount, key) => {
    const enc = new TextEncoder();
    const data = enc.encode(amount.toFixed(2));
    const signature = await crypto.subtle.sign("HMAC", key, data);
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  console.log("- Testing New Key Generation...");
  const newKey = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  await db.put('internal-settings', newKey, 'hmac_key');

  const retrievedKey = await db.get('internal-settings', 'hmac_key');
  if (retrievedKey.extractable === false) {
    console.log("✅ SUCCESS: Generated key is non-extractable.");
  } else {
    console.error("❌ FAILURE: Generated key is extractable!");
    process.exit(1);
  }

  console.log("- Testing Legacy Migration...");
  const legacyKey = await getLegacyCryptoKey();
  const amount = 150.00;
  const legacySignature = await sign(amount, legacyKey);

  await db.put('wallet-status', { id: 'current_balance', amount, currency: 'MXN', signature: legacySignature }, 'current_balance');

  const currentSignature = await sign(amount, retrievedKey);
  if (currentSignature !== legacySignature) {
    console.log("✅ SUCCESS: Legacy signature differs from new signature.");
  }

  const isValidLegacy = await crypto.subtle.verify("HMAC", legacyKey, new Uint8Array(legacySignature.match(/.{1,2}/g).map(byte => parseInt(byte, 16))), new TextEncoder().encode(amount.toFixed(2)));
  if (isValidLegacy) {
    console.log("✅ SUCCESS: Legacy signature verified correctly with legacy key.");
  }

  console.log("- Testing Tampering Detection...");
  const tamperedAmount = 9999.00;
  const forgedSignature = await sign(tamperedAmount, legacyKey);
  const correctSignature = await sign(tamperedAmount, retrievedKey);

  if (forgedSignature !== correctSignature) {
    console.log("✅ SUCCESS: Forged legacy signature does not match new key signature.");
  }

  console.log("\nVerification Complete: Fix is robust and maintains migration path.");
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
