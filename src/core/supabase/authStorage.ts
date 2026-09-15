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

const manifestKey = (key: string) => `${key}.__reclaim_chunks`;
const chunkKey = (key: string, index: number) => `${key}.__reclaim_${index}`;

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

function parseChunkCount(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

const nativeStorage: StorageAdapter = {
  async getItem(key) {
    const SecureStore = await getSecureStore();
    const count = parseChunkCount(await SecureStore.getItemAsync(manifestKey(key)));

    if (count === 0) {
      return SecureStore.getItemAsync(key);
    }

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(key, index)),
      ),
    );

    if (chunks.some((chunk) => chunk === null)) {
      return null;
    }

    return chunks.join('');
  },

  async setItem(key, value) {
    const SecureStore = await getSecureStore();
    const oldCount = parseChunkCount(
      await SecureStore.getItemAsync(manifestKey(key)),
    );
    const chunks = splitStorageValue(value);

    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(chunkKey(key, index), chunk),
      ),
    );
    await SecureStore.setItemAsync(manifestKey(key), String(chunks.length));
    await SecureStore.deleteItemAsync(key);

    if (oldCount > chunks.length) {
      await Promise.all(
        Array.from({ length: oldCount - chunks.length }, (_, offset) =>
          SecureStore.deleteItemAsync(chunkKey(key, chunks.length + offset)),
        ),
      );
    }
  },

  async removeItem(key) {
    const SecureStore = await getSecureStore();
    const count = parseChunkCount(await SecureStore.getItemAsync(manifestKey(key)));

    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(manifestKey(key)),
      ...Array.from({ length: count }, (_, index) =>
        SecureStore.deleteItemAsync(chunkKey(key, index)),
      ),
    ]);
  },
};

export const authStorage: StorageAdapter =
  Platform.OS === 'web' ? webStorage : nativeStorage;
