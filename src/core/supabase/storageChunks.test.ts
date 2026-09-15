import { describe, expect, it } from 'vitest';

import { splitStorageValue } from './storageChunks';

describe('splitStorageValue', () => {
  it('splits and reconstructs values without data loss', () => {
    const value = 'reclaim-session-'.repeat(500);
    const chunks = splitStorageValue(value, 256);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe(value);
    expect(chunks.every((chunk) => chunk.length <= 256)).toBe(true);
  });

  it('preserves an empty value as one chunk', () => {
    expect(splitStorageValue('', 256)).toEqual(['']);
  });

  it('rejects an invalid chunk size', () => {
    expect(() => splitStorageValue('value', 0)).toThrow(
      'chunkSize must be a positive integer',
    );
  });
});
