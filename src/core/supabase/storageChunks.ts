export const SECURE_STORE_CHUNK_SIZE = 1800;

export function splitStorageValue(
  value: string,
  chunkSize = SECURE_STORE_CHUNK_SIZE,
): string[] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error('chunkSize must be a positive integer');
  }

  if (value.length === 0) {
    return [''];
  }

  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push(value.slice(index, index + chunkSize));
  }

  return chunks;
}
