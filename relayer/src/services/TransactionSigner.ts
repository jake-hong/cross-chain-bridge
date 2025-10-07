import { ethers } from 'ethers';
import { TransactionBuilder, BridgeTransaction } from './TransactionBuilder';
import { KMSProvider } from '../kms/types';

export class TransactionSigner {
  private wallet?: ethers.Wallet;
  private kms?: KMSProvider;
  private keyId?: string;
  private provider: ethers.Provider;

  constructor(privateKeyOrKMS: string | KMSProvider, provider: ethers.Provider, keyId?: string) {
    this.provider = provider;

    if (typeof privateKeyOrKMS === 'string') {
      // Direct private key (legacy mode)
      this.wallet = new ethers.Wallet(privateKeyOrKMS, provider);
    } else {
      // KMS mode
      this.kms = privateKeyOrKMS;
      this.keyId = keyId;
    }
  }

  /**
   * Get wallet (from cache or KMS)
   */
  private async getWallet(): Promise<ethers.Wallet> {
    if (this.wallet) {
      return this.wallet;
    }

    if (!this.kms || !this.keyId) {
      throw new Error('No wallet or KMS configuration available');
    }

    // Get private key from KMS
    const privateKey = await this.kms.getKey(this.keyId);
    return new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Sign a bridge transaction message
   */
  async signTransaction(tx: BridgeTransaction): Promise<string> {
    const messageHash = TransactionBuilder.buildMessageHash(tx);

    // Get wallet (either cached or from KMS)
    const wallet = await this.getWallet();

    // Sign the hash directly (eth_sign style)
    const messageHashBytes = ethers.getBytes(messageHash);
    const signature = await wallet.signMessage(messageHashBytes);

    return signature;
  }

  /**
   * Sign multiple transactions
   */
  async signTransactions(txs: BridgeTransaction[]): Promise<string[]> {
    const signatures: string[] = [];

    for (const tx of txs) {
      const signature = await this.signTransaction(tx);
      signatures.push(signature);
    }

    return signatures;
  }

  /**
   * Get signer address
   */
  async getAddress(): Promise<string> {
    const wallet = await this.getWallet();
    return wallet.address;
  }

  /**
   * Get wallet instance (for TransactionSubmitter)
   */
  async getWalletInstance(): Promise<ethers.Wallet> {
    return await this.getWallet();
  }
}
