import { Platform } from 'react-native';

import { splitStorageValue } from './storageChunks';

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

type WebStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type StorageSlot = 'a' | 'b';

type StorageManifest = {
  active: StorageSlot;
  a: number;
  b: number;
};

const manifestKey = (key: string) => `${key}.__reclaim_manifest`;
const chunkKey = (key: string, slot: StorageSlot, index: number) =>
  `${key}.__reclaim_${slot}_${index}`;

function getWebStorage(): WebStorageLike | null {
  const storage = (globalThis as typeof globalThis & { localStorage?: WebStorageLike })
    .localStorage;
  return storage ?? null;
}

const webStorage: StorageAdapter = {
  async getItem(key) {
    return getWebStorage()?.getItem(key) ?? null;
  },
  async setItem(key, value) {
    getWebStorage()?.setItem(key, value);
  },
  async removeItem(key) {
    getWebStorage()?.removeItem(key);
  },
};

async function getSecureStore() {
  return import('expo-secure-store');
}

function isValidChunkCount(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function parseManifest(value: string | null): StorageManifest | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StorageManifest>;
    if (
      (parsed.active === 'a' || parsed.active === 'b') &&
      isValidChunkCount(parsed.a) &&
      isValidChunkCount(parsed.b)
    ) {
      return {
        active: parsed.active,
        a: parsed.a,
        b: parsed.b,
      };
    }
  } catch {
    // Corrupt metadata is treated as a signed-out session rather than guessed at.
  }

  return null;
}

const nativeStorage: StorageAdapter = {
  async getItem(key) {
    const SecureStore = await getSecureStore();
    const rawManifest = await SecureStore.getItemAsync(manifestKey(key));
    const manifest = parseManifest(rawManifest);

    if (!manifest) {
      // Supports the direct-key format if a development build predates chunking.
      return SecureStore.getItemAsync(key);
    }

    const count = manifest[manifest.active];
    if (count === 0) return null;

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(key, manifest.active, index)),
      ),
    );

    if (chunks.some((chunk) => chunk === null)) {
      return null;
    }

    return chunks.join('');
  },

  async setItem(key, value) {
    const SecureStore = await getSecureStore();
    const manifest = parseManifest(
      await SecureStore.getItemAsync(manifestKey(key)),
    );
    const nextSlot: StorageSlot = manifest?.active === 'a' ? 'b' : 'a';
    const previousCountInNextSlot = manifest?.[nextSlot] ?? 0;
    const chunks = splitStorageValue(value);

    // Write the inactive slot first. The old active slot remains valid until the
    // manifest flip below, so an interrupted write cannot produce a partial session.
    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(chunkKey(key, nextSlot, index), chunk),
      ),
    );

    if (previousCountInNextSlot > chunks.length) {
      await Promise.all(
        Array.from(
          { length: previousCountInNextSlot - chunks.length },
          (_, offset) =>
            SecureStore.deleteItemAsync(
              chunkKey(key, nextSlot, chunks.length + offset),
            ),
        ),
      );
    }

    const nextManifest: StorageManifest = {
      active: nextSlot,
      a: nextSlot === 'a' ? chunks.length : (manifest?.a ?? 0),
      b: nextSlot === 'b' ? chunks.length : (manifest?.b ?? 0),
    };

    await SecureStore.setItemAsync(manifestKey(key), JSON.stringify(nextManifest));
    await SecureStore.deleteItemAsync(key);
  },

  async removeItem(key) {
    const SecureStore = await getSecureStore();
    const manifest = parseManifest(
      await SecureStore.getItemAsync(manifestKey(key)),
    );

    const chunkDeletes = manifest
      ? (['a', 'b'] as const).flatMap((slot) =>
          Array.from({ length: manifest[slot] }, (_, index) =>
            SecureStore.deleteItemAsync(chunkKey(key, slot, index)),
          ),
        )
      : [];

    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(manifestKey(key)),
      ...chunkDeletes,
    ]);
  },
};

export const authStorage: StorageAdapter =
  Platform.OS === 'web' ? webStorage : nativeStorage;
