import { ethers } from 'ethers';
import { BridgeTransaction, TransactionBuilder } from './TransactionBuilder';
import { TransactionSigner } from './TransactionSigner';
import BridgeABI from '../abis/Bridge.json';

export interface SubmitResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export class TransactionSubmitter {
  private provider: ethers.JsonRpcProvider;
  private signer: TransactionSigner;
  private bridgeAddress: string;

  constructor(
    provider: ethers.JsonRpcProvider,
    signer: TransactionSigner,
    bridgeAddress: string
  ) {
    this.provider = provider;
    this.signer = signer;
    this.bridgeAddress = bridgeAddress;
  }

  /**
   * Submit a bridge transaction to the destination chain
   */
  async submitTransaction(
    tx: BridgeTransaction,
    signatures: string[]
  ): Promise<SubmitResult> {
    try {
      const bridge = new ethers.Contract(
        this.bridgeAddress,
        BridgeABI,
        this.signer.getWallet()
      );

      console.log('Submitting transaction:', {
        token: tx.token,
        user: tx.user,
        amount: tx.amount.toString(),
        transactionId: tx.transactionId,
        signatures: signatures.length,
      });

      // Call completeBridgeTransfer
      const txResponse = await bridge.completeBridgeTransfer(
        tx.token,
        tx.user,
        tx.amount,
        tx.transactionId,
        signatures
      );

      console.log('Transaction submitted:', txResponse.hash);

      // Wait for confirmation
      const receipt = await txResponse.wait();

      if (receipt.status === 1) {
        console.log('Transaction confirmed:', receipt.hash);
        return {
          success: true,
          txHash: receipt.hash,
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed',
        };
      }
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Estimate gas for a bridge transaction
   */
  async estimateGas(
    tx: BridgeTransaction,
    signatures: string[]
  ): Promise<bigint> {
    const bridge = new ethers.Contract(
      this.bridgeAddress,
      BridgeABI,
      this.signer.getWallet()
    );

    const gasEstimate = await bridge.completeBridgeTransfer.estimateGas(
      tx.token,
      tx.user,
      tx.amount,
      tx.transactionId,
      signatures
    );

    return gasEstimate;
  }
}
