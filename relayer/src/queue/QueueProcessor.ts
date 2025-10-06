import { TransactionQueue, TransactionStatus } from './TransactionQueue';
import { TransactionSigner } from '../services/TransactionSigner';
import { TransactionSubmitter } from '../services/TransactionSubmitter';

export interface ProcessorConfig {
  retryDelayMs: number;
  maxRetries: number;
  processingIntervalMs: number;
  cleanupIntervalMs: number;
}

export class QueueProcessor {
  private queue: TransactionQueue;
  private signers: Map<number, TransactionSigner>;
  private submitters: Map<number, TransactionSubmitter>;
  private config: ProcessorConfig;
  private processingInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(
    queue: TransactionQueue,
    signers: Map<number, TransactionSigner>,
    submitters: Map<number, TransactionSubmitter>,
    config: ProcessorConfig
  ) {
    this.queue = queue;
    this.signers = signers;
    this.submitters = submitters;
    this.config = config;
  }

  /**
   * Start processing the queue
   */
  start(): void {
    if (this.isRunning) {
      console.log('Queue processor already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting queue processor...');

    // Start processing interval
    this.processingInterval = setInterval(
      () => this.processNext(),
      this.config.processingIntervalMs
    );

    // Start cleanup interval
    this.cleanupInterval = setInterval(
      () => this.queue.cleanup(),
      this.config.cleanupIntervalMs
    );

    console.log('Queue processor started');
  }

  /**
   * Stop processing the queue
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    console.log('Queue processor stopped');
  }

  /**
   * Process next transaction in queue
   */
  private async processNext(): Promise<void> {
    const queuedTx = this.queue.getNext();

    if (!queuedTx) {
      return;
    }

    // Mark as processing
    this.queue.markProcessing(queuedTx.id);

    try {
      console.log(`Processing transaction ${queuedTx.id} (attempt ${queuedTx.retryCount + 1})`);

      const tx = queuedTx.transaction;

      // Get signer for source chain
      const signer = this.signers.get(tx.sourceChainId);
      if (!signer) {
        throw new Error(`No signer found for chain ${tx.sourceChainId}`);
      }

      // Sign transaction
      const signature = await signer.signTransaction(tx);
      console.log(`Transaction ${queuedTx.id} signed`);

      // Get submitter for target chain
      const submitter = this.submitters.get(tx.targetChainId);
      if (!submitter) {
        throw new Error(`No submitter found for chain ${tx.targetChainId}`);
      }

      // Submit transaction
      const result = await submitter.submitTransaction(tx, [signature]);

      if (result.success) {
        this.queue.markCompleted(queuedTx.id, result.txHash);
        console.log(`Transaction ${queuedTx.id} completed: ${result.txHash}`);
      } else {
        throw new Error(result.error || 'Transaction submission failed');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      console.error(`Transaction ${queuedTx.id} failed:`, errorMsg);

      this.queue.markFailed(queuedTx.id, errorMsg, this.config.retryDelayMs);
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return this.queue.getStats();
  }

  /**
   * Check if processor is running
   */
  isProcessorRunning(): boolean {
    return this.isRunning;
  }
}
