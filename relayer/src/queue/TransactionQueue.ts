import { BridgeTransaction } from '../services/TransactionBuilder';
import { TransactionRepository } from '../database/TransactionRepository';

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface QueuedTransaction {
  id: string;
  transaction: BridgeTransaction;
  status: TransactionStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
  nextRetryAt?: number;
}

export class TransactionQueue {
  private queue: Map<string, QueuedTransaction> = new Map();
  private processingIds: Set<string> = new Set();
  private repository?: TransactionRepository;

  /**
   * Set database repository
   */
  setRepository(repository: TransactionRepository): void {
    this.repository = repository;
  }

  /**
   * Add a transaction to the queue
   */
  add(transaction: BridgeTransaction, maxRetries: number = 3): QueuedTransaction {
    const id = this.generateId(transaction);

    // Check if already exists
    if (this.queue.has(id)) {
      const existing = this.queue.get(id)!;
      console.log(`Transaction ${id} already in queue with status: ${existing.status}`);
      return existing;
    }

    const queuedTx: QueuedTransaction = {
      id,
      transaction,
      status: TransactionStatus.PENDING,
      retryCount: 0,
      maxRetries,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.queue.set(id, queuedTx);
    console.log(`Transaction ${id} added to queue`);

    // Save to database if repository is available
    if (this.repository) {
      this.repository.save(queuedTx).catch((err) => {
        console.error('Error saving transaction to database:', err);
      });
    }

    return queuedTx;
  }

  /**
   * Get next pending transaction
   */
  getNext(): QueuedTransaction | null {
    const now = Date.now();

    for (const [id, tx] of this.queue.entries()) {
      // Skip if already processing
      if (this.processingIds.has(id)) {
        continue;
      }

      // Get pending transactions
      if (tx.status === TransactionStatus.PENDING) {
        return tx;
      }

      // Get failed transactions ready for retry
      if (tx.status === TransactionStatus.FAILED) {
        if (tx.retryCount < tx.maxRetries) {
          if (!tx.nextRetryAt || tx.nextRetryAt <= now) {
            return tx;
          }
        }
      }
    }

    return null;
  }

  /**
   * Mark transaction as processing
   */
  markProcessing(id: string): void {
    const tx = this.queue.get(id);
    if (tx) {
      tx.status = TransactionStatus.PROCESSING;
      tx.updatedAt = Date.now();
      this.processingIds.add(id);
      this.queue.set(id, tx);

      // Update in database
      if (this.repository) {
        this.repository.save(tx).catch((err) => {
          console.error('Error updating transaction in database:', err);
        });
      }
    }
  }

  /**
   * Mark transaction as completed
   */
  markCompleted(id: string, completedTxHash?: string): void {
    const tx = this.queue.get(id);
    if (tx) {
      tx.status = TransactionStatus.COMPLETED;
      tx.updatedAt = Date.now();
      this.processingIds.delete(id);
      this.queue.set(id, tx);
      console.log(`Transaction ${id} marked as completed`);

      // Update in database
      if (this.repository) {
        this.repository.updateStatus(id, TransactionStatus.COMPLETED, completedTxHash).catch((err) => {
          console.error('Error updating transaction in database:', err);
        });
      }
    }
  }

  /**
   * Mark transaction as failed and schedule retry
   */
  markFailed(id: string, error: string, retryDelayMs: number): void {
    const tx = this.queue.get(id);
    if (tx) {
      tx.status = TransactionStatus.FAILED;
      tx.lastError = error;
      tx.retryCount++;
      tx.updatedAt = Date.now();
      this.processingIds.delete(id);

      if (tx.retryCount < tx.maxRetries) {
        // Calculate exponential backoff
        const backoffMs = retryDelayMs * Math.pow(2, tx.retryCount - 1);
        tx.nextRetryAt = Date.now() + backoffMs;
        console.log(`Transaction ${id} failed (${tx.retryCount}/${tx.maxRetries}), retry in ${backoffMs}ms`);
      } else {
        console.log(`Transaction ${id} failed permanently after ${tx.retryCount} retries`);
      }

      this.queue.set(id, tx);

      // Update in database
      if (this.repository) {
        this.repository.save(tx).catch((err) => {
          console.error('Error updating transaction in database:', err);
        });
      }
    }
  }

  /**
   * Get transaction by ID
   */
  get(id: string): QueuedTransaction | undefined {
    return this.queue.get(id);
  }

  /**
   * Get all transactions with a specific status
   */
  getByStatus(status: TransactionStatus): QueuedTransaction[] {
    return Array.from(this.queue.values()).filter((tx) => tx.status === status);
  }

  /**
   * Remove completed transactions older than a certain time
   */
  cleanup(olderThanMs: number = 3600000): number {
    const cutoffTime = Date.now() - olderThanMs;
    let removed = 0;

    for (const [id, tx] of this.queue.entries()) {
      if (tx.status === TransactionStatus.COMPLETED && tx.updatedAt < cutoffTime) {
        this.queue.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`Cleaned up ${removed} completed transactions`);
    }

    return removed;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const stats = {
      total: this.queue.size,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const tx of this.queue.values()) {
      switch (tx.status) {
        case TransactionStatus.PENDING:
          stats.pending++;
          break;
        case TransactionStatus.PROCESSING:
          stats.processing++;
          break;
        case TransactionStatus.COMPLETED:
          stats.completed++;
          break;
        case TransactionStatus.FAILED:
          stats.failed++;
          break;
      }
    }

    return stats;
  }

  /**
   * Generate unique ID for a transaction
   */
  private generateId(tx: BridgeTransaction): string {
    return `${tx.sourceChainId}-${tx.targetChainId}-${tx.transactionId}`;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Clear all transactions
   */
  clear(): void {
    this.queue.clear();
    this.processingIds.clear();
    console.log('Transaction queue cleared');
  }
}
