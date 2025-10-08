import { ethers } from 'ethers';
import { KMSProvider } from './types';

export interface RotationConfig {
  keyId: string;
  bridgeAddress: string;
  bridgeABI: any[];
  ownerWallet: ethers.Wallet;
}

export class KeyRotationManager {
  private kms: KMSProvider;

  constructor(kms: KMSProvider) {
    this.kms = kms;
  }

  /**
   * Generate a new private key
   */
  private generateNewKey(): string {
    const wallet = ethers.Wallet.createRandom();
    return wallet.privateKey;
  }

  /**
   * Rotate a key in KMS
   */
  async rotateKey(keyId: string): Promise<{ oldAddress: string; newAddress: string; newPrivateKey: string }> {
    console.log(`Starting key rotation for: ${keyId}`);

    // Get old key
    const oldPrivateKey = await this.kms.getKey(keyId);
    const oldWallet = new ethers.Wallet(oldPrivateKey);
    const oldAddress = oldWallet.address;

    // Generate new key
    const newPrivateKey = this.generateNewKey();
    const newWallet = new ethers.Wallet(newPrivateKey);
    const newAddress = newWallet.address;

    // Store new key with versioned ID
    const timestamp = Date.now();
    const newKeyId = `${keyId}-${timestamp}`;
    await this.kms.storeKey(newKeyId, newPrivateKey);

    // Update the main key ID
    await this.kms.storeKey(keyId, newPrivateKey);

    console.log(`Key rotated successfully:`);
    console.log(`  Old Address: ${oldAddress}`);
    console.log(`  New Address: ${newAddress}`);
    console.log(`  New Key ID: ${newKeyId}`);

    return { oldAddress, newAddress, newPrivateKey };
  }

  /**
   * Rotate key and update Bridge contract validators
   */
  async rotateKeyWithBridgeUpdate(config: RotationConfig): Promise<void> {
    const { keyId, bridgeAddress, bridgeABI, ownerWallet } = config;

    console.log(`Rotating key and updating Bridge contract at ${bridgeAddress}`);

    // Rotate the key
    const { oldAddress, newAddress } = await this.rotateKey(keyId);

    // Connect to Bridge contract
    const bridge = new ethers.Contract(bridgeAddress, bridgeABI, ownerWallet);

    // Add new validator
    console.log(`Adding new validator: ${newAddress}`);
    const addTx = await bridge.addValidator(newAddress);
    await addTx.wait();
    console.log(`New validator added in tx: ${addTx.hash}`);

    // Remove old validator
    console.log(`Removing old validator: ${oldAddress}`);
    const removeTx = await bridge.removeValidator(oldAddress);
    await removeTx.wait();
    console.log(`Old validator removed in tx: ${removeTx.hash}`);

    console.log(`Key rotation and Bridge update completed successfully`);
  }

  /**
   * Schedule automatic key rotation
   */
  scheduleRotation(keyId: string, intervalMs: number): NodeJS.Timeout {
    console.log(`Scheduling key rotation for ${keyId} every ${intervalMs}ms`);

    return setInterval(async () => {
      try {
        console.log(`Executing scheduled key rotation for ${keyId}`);
        await this.rotateKey(keyId);
      } catch (error) {
        console.error(`Scheduled key rotation failed for ${keyId}:`, error);
      }
    }, intervalMs);
  }

  /**
   * Get key rotation history
   */
  async getRotationHistory(keyId: string): Promise<string[]> {
    const allKeys = await this.kms.listKeys();
    const historyKeys = allKeys.filter((key) => key.startsWith(`${keyId}-`));
    return historyKeys.sort();
  }

  /**
   * Cleanup old rotated keys
   */
  async cleanupOldKeys(keyId: string, keepCount: number = 3): Promise<void> {
    const history = await this.getRotationHistory(keyId);

    if (history.length <= keepCount) {
      console.log(`No old keys to cleanup for ${keyId}`);
      return;
    }

    // Keep only the latest N keys
    const toDelete = history.slice(0, history.length - keepCount);

    console.log(`Cleaning up ${toDelete.length} old keys for ${keyId}`);

    for (const oldKeyId of toDelete) {
      await this.kms.deleteKey(oldKeyId);
      console.log(`Deleted old key: ${oldKeyId}`);
    }

    console.log(`Cleanup completed`);
  }
}
