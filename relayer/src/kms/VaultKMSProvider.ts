import vault from 'node-vault';
import { KMSProvider, VaultConfig } from './types';

export class VaultKMSProvider implements KMSProvider {
  private client: any;
  private basePath: string;

  constructor(config: VaultConfig) {
    this.client = vault({
      apiVersion: 'v1',
      endpoint: config.address,
      token: config.token,
      namespace: config.namespace,
    });

    this.basePath = 'secret/data/relayer/keys';
  }

  /**
   * Get a private key from Vault
   */
  async getKey(keyId: string): Promise<string> {
    try {
      const path = `${this.basePath}/${keyId}`;
      const result = await this.client.read(path);

      if (!result?.data?.data?.privateKey) {
        throw new Error(`Key not found: ${keyId}`);
      }

      console.log(`Retrieved key from Vault: ${keyId}`);
      return result.data.data.privateKey;
    } catch (error: any) {
      console.error(`Error retrieving key from Vault: ${keyId}`, error.message);
      throw error;
    }
  }

  /**
   * Store a private key in Vault
   */
  async storeKey(keyId: string, privateKey: string): Promise<void> {
    try {
      const path = `${this.basePath}/${keyId}`;
      await this.client.write(path, {
        data: {
          privateKey,
          createdAt: new Date().toISOString(),
        },
      });

      console.log(`Stored key in Vault: ${keyId}`);
    } catch (error: any) {
      console.error(`Error storing key in Vault: ${keyId}`, error.message);
      throw error;
    }
  }

  /**
   * Delete a key from Vault
   */
  async deleteKey(keyId: string): Promise<void> {
    try {
      const path = `${this.basePath}/${keyId}`;
      await this.client.delete(path);

      console.log(`Deleted key from Vault: ${keyId}`);
    } catch (error: any) {
      console.error(`Error deleting key from Vault: ${keyId}`, error.message);
      throw error;
    }
  }

  /**
   * Check if a key exists in Vault
   */
  async keyExists(keyId: string): Promise<boolean> {
    try {
      const path = `${this.basePath}/${keyId}`;
      await this.client.read(path);
      return true;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List all key IDs in Vault
   */
  async listKeys(): Promise<string[]> {
    try {
      const path = 'secret/metadata/relayer/keys';
      const result = await this.client.list(path);

      if (!result?.data?.keys) {
        return [];
      }

      return result.data.keys;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        return [];
      }
      console.error('Error listing keys from Vault:', error.message);
      throw error;
    }
  }
}
