import { ethers } from 'ethers';
import { BridgeEventData, TokensLockedEvent } from '../types/events';
import BridgeABI from '../abis/Bridge.json';

export interface BridgeTransaction {
  token: string;
  user: string;
  amount: bigint;
  transactionId: string;
  targetChainId: number;
  sourceChainId: number;
  nonce: bigint;
}

export class TransactionBuilder {
  /**
   * Build a transaction from TokensLocked event
   */
  static fromLockedEvent(event: BridgeEventData): BridgeTransaction {
    if (event.event !== 'TokensLocked') {
      throw new Error('Event must be TokensLocked');
    }

    const data = event.data as TokensLockedEvent;

    return {
      token: data.token,
      user: data.user,
      amount: data.amount,
      transactionId: event.transactionHash,
      targetChainId: event.targetChainId,
      sourceChainId: event.sourceChainId,
      nonce: data.nonce,
    };
  }

  /**
   * Build message hash for validator signatures
   */
  static buildMessageHash(tx: BridgeTransaction): string {
    const message = ethers.solidityPackedKeccak256(
      ['address', 'address', 'uint256', 'bytes32', 'uint256'],
      [tx.token, tx.user, tx.amount, tx.transactionId, tx.targetChainId]
    );

    return message;
  }

  /**
   * Build unsigned transaction data for completeBridgeTransfer
   */
  static buildCompleteBridgeTransferData(
    tx: BridgeTransaction,
    signatures: string[]
  ): string {
    const iface = new ethers.Interface(BridgeABI);

    const data = iface.encodeFunctionData('completeBridgeTransfer', [
      tx.token,
      tx.user,
      tx.amount,
      tx.transactionId,
      signatures,
    ]);

    return data;
  }
}
