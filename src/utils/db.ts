import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'cancunmueve-db';
const DB_VERSION = 4;

// Legacy salt used in v1-v3. Kept for one-time migration to non-extractable keys.
const LEGACY_SALT = "cancunmueve_wallet_secure_salt_v1";

let _cryptoKey: CryptoKey | null = null;

/**
 * Retrieves or generates a non-extractable HMAC key stored in IndexedDB.
 * This prevents users from extracting the key material via DevTools.
 */
const getCryptoKey = async (db?: IDBPDatabase): Promise<CryptoKey> => {
  if (_cryptoKey) return _cryptoKey;

  const activeDb = db || await initDB();

  // Try to get existing key from internal settings
  const stored = await activeDb.get('internal-settings', 'hmac_key');
  if (stored instanceof CryptoKey) {
    _cryptoKey = stored;
    return _cryptoKey;
  }

  // Generate new non-extractable key
  const newKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false, // NOT extractable - this is the security fix
    ["sign", "verify"]
  );

  // Store it for future use
  const tx = activeDb.transaction('internal-settings', 'readwrite');
  await tx.objectStore('internal-settings').put(newKey, 'hmac_key');
  await tx.done;

  _cryptoKey = newKey;
  return _cryptoKey;
};

/**
 * Legacy key generator for migration verification.
 */
const getLegacyCryptoKey = async (): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = enc.encode(LEGACY_SALT);
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

const generateSignature = async (amount: number, db?: IDBPDatabase): Promise<string> => {
  const key = await getCryptoKey(db);
  const enc = new TextEncoder();
  const data = enc.encode(amount.toFixed(2));
  const signature = await crypto.subtle.sign("HMAC", key, data);
  // Convert ArrayBuffer to Hex String
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Verifies signature and returns a status.
 * 'valid' - matches new key
 * 'legacy' - matches old hardcoded salt (needs re-sign)
 * 'invalid' - tampering detected
 */
const verifySignatureStatus = async (amount: number, signatureHex: string | undefined, db?: IDBPDatabase): Promise<'valid' | 'legacy' | 'invalid'> => {
  if (!signatureHex) return 'invalid';

  try {
    // 1. Try with new non-extractable key
    const currentSignature = await generateSignature(amount, db);
    if (currentSignature === signatureHex) return 'valid';

    // 2. Fallback to legacy salt for migration
    const legacyKey = await getLegacyCryptoKey();
    const enc = new TextEncoder();
    const data = enc.encode(amount.toFixed(2));
    const isValidLegacy = await crypto.subtle.verify("HMAC", legacyKey, new Uint8Array(signatureHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))), data);

    return isValidLegacy ? 'legacy' : 'invalid';
  } catch (e) {
    console.error('[SECURITY] Signature verification error:', e);
    return 'invalid';
  }
};

const verifySignature = async (amount: number, signatureHex: string | undefined, db?: IDBPDatabase): Promise<boolean> => {
  const status = await verifySignatureStatus(amount, signatureHex, db);
  return status === 'valid' || status === 'legacy';
};

/**
 * Migrate balance from localStorage to IndexedDB.
 */
export const migrateBalanceFromLocalStorage = async (db: IDBPDatabase): Promise<void> => {
  try {
    // Check if migration already done
    const migrationDone = localStorage.getItem('balance_migration_done');
    if (migrationDone === 'true') {
      return;
    }

    const tx = db.transaction('wallet-status', 'readwrite');
    const store = tx.objectStore('wallet-status');

    let localBalance: number | null = null;
    const muevecancunBalance = localStorage.getItem('muevecancun_balance');
    if (muevecancunBalance !== null) {
      localBalance = parseFloat(muevecancunBalance);
    }

    if (localBalance === null || isNaN(localBalance)) {
      const userBalance = localStorage.getItem('user_balance');
      if (userBalance !== null) {
        localBalance = parseFloat(userBalance);
      }
    }

    const existing = await store.get('current_balance');

    if (localBalance !== null && !isNaN(localBalance) && localBalance > 0) {
      if (existing) {
        if (localBalance > existing.amount) {
          existing.amount = localBalance;
          existing.signature = await generateSignature(localBalance, db);
          await store.put(existing, 'current_balance');
        } else if (!existing.signature) {
          existing.signature = await generateSignature(existing.amount, db);
          await store.put(existing, 'current_balance');
        }
      } else {
        const signature = await generateSignature(localBalance, db);
        await store.put({ id: 'current_balance', amount: localBalance, currency: 'MXN', signature }, 'current_balance');
      }
    } else if (existing && !existing.signature) {
      existing.signature = await generateSignature(existing.amount, db);
      await store.put(existing, 'current_balance');
    }

    localStorage.setItem('balance_migration_done', 'true');
    localStorage.removeItem('muevecancun_balance');
    localStorage.removeItem('user_balance');

    await tx.done;
    console.log('[DB] Balance migration completed successfully');
  } catch (e) {
    console.error('[DB] Balance migration failed:', e);
  }
};

let dbPromise: Promise<IDBPDatabase> | null = null;

export const initDB = async (): Promise<IDBPDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          if (oldVersion < 1) {
            db.createObjectStore('routes');
            db.createObjectStore('user-reports');
          }
          if (oldVersion < 2) {
            db.createObjectStore('wallet-status');
          }
          if (oldVersion < 4) {
             if (!db.objectStoreNames.contains('internal-settings')) {
                 db.createObjectStore('internal-settings');
             }
          }
        },
      });

      // Initialize test balance if empty
      const tx = db.transaction('wallet-status', 'readwrite');
      const store = tx.objectStore('wallet-status');
      const balance = await store.get('current_balance');

      if (balance === undefined) {
        const defaultAmount = 180.00;
        const signature = await generateSignature(defaultAmount, db);
        await store.put({ id: 'current_balance', amount: defaultAmount, currency: 'MXN', signature }, 'current_balance');
      }

      await tx.done;

      // Run migration
      await migrateBalanceFromLocalStorage(db);

      return db;
    } catch (error) {
      console.error('[DB] Initialization failed:', error);
      dbPromise = null;
      throw error;
    }
  })();

  return dbPromise;
};

export const getWalletBalance = async (): Promise<{ id: string; amount: number; currency: string; signature?: string } | undefined> => {
  const db = await initDB();

  const readTx = db.transaction('wallet-status', 'readonly');
  const balance = await readTx.objectStore('wallet-status').get('current_balance');
  await readTx.done;

  if (balance) {
    if (!balance.signature) {
      balance.signature = await generateSignature(balance.amount, db);
      const writeTx = db.transaction('wallet-status', 'readwrite');
      await writeTx.objectStore('wallet-status').put(balance, 'current_balance');
      await writeTx.done;
      return balance;
    }

    const status = await verifySignatureStatus(balance.amount, balance.signature, db);

    if (status === 'legacy') {
      console.log('[SECURITY] Legacy signature detected. Re-signing with new non-extractable key.');
      balance.signature = await generateSignature(balance.amount, db);
      const writeTx = db.transaction('wallet-status', 'readwrite');
      await writeTx.objectStore('wallet-status').put(balance, 'current_balance');
      await writeTx.done;
      return balance;
    }

    if (status === 'invalid') {
      console.error('[SECURITY] Wallet balance signature verification failed. Possible tampering detected. Resetting to 0.00 MXN.');
      const resetAmount = 0.00;
      balance.amount = resetAmount;
      balance.signature = await generateSignature(resetAmount, db);
      const writeTx = db.transaction('wallet-status', 'readwrite');
      await writeTx.objectStore('wallet-status').put(balance, 'current_balance');
      await writeTx.done;
      return balance;
    }
  }

  return balance;
};

export const setWalletBalance = async (amount: number): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction('wallet-status', 'readwrite');
  const store = tx.objectStore('wallet-status');
  const existing = await store.get('current_balance');

  const signature = await generateSignature(amount, db);

  if (existing) {
    existing.amount = amount;
    existing.signature = signature;
    await store.put(existing, 'current_balance');
  } else {
    await store.put({ id: 'current_balance', amount, currency: 'MXN', signature }, 'current_balance');
  }

  await tx.done;
};

export const updateWalletBalance = async (amount: number) => {
  const db = await initDB();
  const balance = await getWalletBalance();
  if (balance) {
    const tx = db.transaction('wallet-status', 'readwrite');
    const store = tx.objectStore('wallet-status');
    const newAmount = balance.amount + amount;
    balance.amount = newAmount;
    balance.signature = await generateSignature(newAmount, db);
    await store.put(balance, 'current_balance');
    await tx.done;
  }
};

// Test util
export const __resetDBPromise = () => { dbPromise = null; _cryptoKey = null; };
