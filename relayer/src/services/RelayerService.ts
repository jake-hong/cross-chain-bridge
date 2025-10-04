import { ethers } from 'ethers';
import { EventListener } from './EventListener';
import { BridgeEventData } from '../types/events';
import { CHAIN_CONFIGS, ChainConfig } from '../config/chains';
import { TransactionBuilder } from './TransactionBuilder';
import { TransactionSigner } from './TransactionSigner';
import { TransactionSubmitter } from './TransactionSubmitter';

export class RelayerService {
  private listeners: Map<string, EventListener> = new Map();
  private signers: Map<number, TransactionSigner> = new Map();
  private submitters: Map<number, TransactionSubmitter> = new Map();
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  async start(): Promise<void> {
    console.log('Starting Relayer Service...');

    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      throw new Error('RELAYER_PRIVATE_KEY not set in environment');
    }

    // Initialize providers, signers, and submitters for all chains
    for (const [chainName, config] of Object.entries(CHAIN_CONFIGS)) {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      this.providers.set(config.chainId, provider);

      const signer = new TransactionSigner(relayerPrivateKey, provider);
      this.signers.set(config.chainId, signer);

      const submitter = new TransactionSubmitter(
        provider,
        signer,
        config.bridgeAddress
      );
      this.submitters.set(config.chainId, submitter);

      console.log(`Initialized signer for ${chainName} (${config.chainId}): ${signer.getAddress()}`);

      // Initialize event listeners
      const listener = new EventListener(config);
      this.listeners.set(chainName, listener);

      // Catch up on missed events first
      await listener.catchUp(this.handleEvent.bind(this));

      // Start listening for new events
      await listener.start(this.handleEvent.bind(this));
    }

    console.log('Relayer Service started successfully');
  }

  async stop(): Promise<void> {
    console.log('Stopping Relayer Service...');

    for (const listener of this.listeners.values()) {
      await listener.stop();
    }

    this.listeners.clear();
    console.log('Relayer Service stopped');
  }

  private async handleEvent(event: BridgeEventData): Promise<void> {
    console.log('Received event:', {
      type: event.event,
      chain: event.sourceChainId,
      block: event.blockNumber,
      tx: event.transactionHash,
    });

    try {
      switch (event.event) {
        case 'TokensLocked':
          await this.handleTokensLocked(event);
          break;
        case 'TokensMinted':
          console.log('TokensMinted event processed (confirmation)');
          break;
        case 'TokensUnlocked':
          console.log('TokensUnlocked event processed (confirmation)');
          break;
        default:
          console.warn('Unknown event type:', event.event);
      }
    } catch (error) {
      console.error('Error handling event:', error);
      // TODO: Add to retry queue
    }
  }

  private async handleTokensLocked(event: BridgeEventData): Promise<void> {
    console.log('Processing TokensLocked event:', event);

    try {
      // Build transaction from event
      const tx = TransactionBuilder.fromLockedEvent(event);

      // Get signer for source chain to sign the transaction
      const signer = this.signers.get(event.sourceChainId);
      if (!signer) {
        throw new Error(`No signer found for chain ${event.sourceChainId}`);
      }

      // Sign the transaction
      const signature = await signer.signTransaction(tx);
      console.log('Transaction signed:', signature.slice(0, 20) + '...');

      // Get submitter for target chain
      const submitter = this.submitters.get(event.targetChainId);
      if (!submitter) {
        throw new Error(`No submitter found for chain ${event.targetChainId}`);
      }

      // Submit transaction to destination chain
      const result = await submitter.submitTransaction(tx, [signature]);

      if (result.success) {
        console.log('Bridge transfer completed successfully:', result.txHash);
      } else {
        console.error('Bridge transfer failed:', result.error);
        // TODO: Add to retry queue
      }
    } catch (error) {
      console.error('Error processing TokensLocked event:', error);
      // TODO: Add to retry queue
    }
  }
}
