import { ethers } from 'ethers';
import { TransactionBuilder, BridgeTransaction } from './TransactionBuilder';

export class TransactionSigner {
  private wallet: ethers.Wallet;

  constructor(privateKey: string, provider: ethers.Provider) {
    this.wallet = new ethers.Wallet(privateKey, provider);
  }

  /**
   * Sign a bridge transaction message
   */
  async signTransaction(tx: BridgeTransaction): Promise<string> {
    const messageHash = TransactionBuilder.buildMessageHash(tx);

    // Sign the hash directly (eth_sign style)
    const messageHashBytes = ethers.getBytes(messageHash);
    const signature = await this.wallet.signMessage(messageHashBytes);

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
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get wallet instance
   */
  getWallet(): ethers.Wallet {
    return this.wallet;
  }
}
