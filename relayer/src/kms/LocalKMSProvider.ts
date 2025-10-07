import { KMSProvider } from './types';

/**
 * Local KMS provider for development/testing
 * Stores keys in memory (not secure for production!)
 */
export class LocalKMSProvider implements KMSProvider {
  private keys: Map<string, string> = new Map();

  async getKey(keyId: string): Promise<string> {
    const key = this.keys.get(keyId);

    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    console.log(`Retrieved key from local storage: ${keyId}`);
    return key;
  }

  async storeKey(keyId: string, privateKey: string): Promise<void> {
    this.keys.set(keyId, privateKey);
    console.log(`Stored key in local storage: ${keyId}`);
  }

  async deleteKey(keyId: string): Promise<void> {
    this.keys.delete(keyId);
    console.log(`Deleted key from local storage: ${keyId}`);
  }

  async keyExists(keyId: string): Promise<boolean> {
    return this.keys.has(keyId);
  }

  async listKeys(): Promise<string[]> {
    return Array.from(this.keys.keys());
  }
}
