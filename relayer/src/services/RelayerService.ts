import { ethers } from 'ethers';
import { EventListener } from './EventListener';
import { BridgeEventData } from '../types/events';
import { CHAIN_CONFIGS, ChainConfig } from '../config/chains';
import { TransactionBuilder } from './TransactionBuilder';
import { TransactionSigner } from './TransactionSigner';
import { TransactionSubmitter } from './TransactionSubmitter';
import { TransactionQueue } from '../queue/TransactionQueue';
import { QueueProcessor } from '../queue/QueueProcessor';

export class RelayerService {
  private listeners: Map<string, EventListener> = new Map();
  private signers: Map<number, TransactionSigner> = new Map();
  private submitters: Map<number, TransactionSubmitter> = new Map();
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private queue: TransactionQueue;
  private processor: QueueProcessor;

  constructor() {
    this.queue = new TransactionQueue();

    // Initialize processor with default config (will be updated in start())
    this.processor = new QueueProcessor(
      this.queue,
      new Map(),
      new Map(),
      {
        retryDelayMs: 5000,
        maxRetries: 3,
        processingIntervalMs: 1000,
        cleanupIntervalMs: 60000,
      }
    );
  }

  async start(): Promise<void> {
    console.log('Starting Relayer Service...');

    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      throw new Error('RELAYER_PRIVATE_KEY not set in environment');
    }

    // Read config from environment
    const retryDelayMs = parseInt(process.env.RETRY_DELAY_MS || '5000', 10);
    const maxRetries = parseInt(process.env.RETRY_ATTEMPTS || '3', 10);
    const processingIntervalMs = parseInt(process.env.PROCESSING_INTERVAL_MS || '1000', 10);
    const cleanupIntervalMs = parseInt(process.env.CLEANUP_INTERVAL_MS || '60000', 10);

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

    // Initialize and start queue processor
    this.processor = new QueueProcessor(
      this.queue,
      this.signers,
      this.submitters,
      {
        retryDelayMs,
        maxRetries,
        processingIntervalMs,
        cleanupIntervalMs,
      }
    );
    this.processor.start();

    console.log('Relayer Service started successfully');

    // Log queue stats periodically
    setInterval(() => {
      const stats = this.processor.getStats();
      console.log('Queue stats:', stats);
    }, 30000); // Every 30 seconds
  }

  async stop(): Promise<void> {
    console.log('Stopping Relayer Service...');

    // Stop queue processor
    this.processor.stop();

    // Stop event listeners
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

      // Add to queue for processing
      const maxRetries = parseInt(process.env.RETRY_ATTEMPTS || '3', 10);
      this.queue.add(tx, maxRetries);

      console.log(`Transaction added to queue: ${tx.transactionId}`);
    } catch (error) {
      console.error('Error processing TokensLocked event:', error);
    }
  }
}
