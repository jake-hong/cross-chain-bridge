export interface KMSProvider {
  /**
   * Get a private key from KMS
   */
  getKey(keyId: string): Promise<string>;

  /**
   * Store a private key in KMS
   */
  storeKey(keyId: string, privateKey: string): Promise<void>;

  /**
   * Delete a key from KMS
   */
  deleteKey(keyId: string): Promise<void>;

  /**
   * Check if a key exists
   */
  keyExists(keyId: string): Promise<boolean>;

  /**
   * List all key IDs
   */
  listKeys(): Promise<string[]>;
}

export interface VaultConfig {
  address: string;
  token: string;
  namespace?: string;
}

export interface KMSConfig {
  provider: 'vault' | 'aws' | 'local';
  vault?: VaultConfig;
}
