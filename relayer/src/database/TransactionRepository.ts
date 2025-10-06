import { Database } from './Database';
import { BridgeTransaction } from '../services/TransactionBuilder';
import { TransactionStatus, QueuedTransaction } from '../queue/TransactionQueue';

export class TransactionRepository {
  constructor(private db: Database) {}

  /**
   * Save a transaction to the database
   */
  async save(tx: QueuedTransaction): Promise<void> {
    const query = `
      INSERT INTO transactions (
        id, transaction_hash, source_chain_id, target_chain_id,
        token_address, user_address, amount, nonce,
        status, retry_count, max_retries, last_error,
        created_at, updated_at, next_retry_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        retry_count = EXCLUDED.retry_count,
        last_error = EXCLUDED.last_error,
        updated_at = EXCLUDED.updated_at,
        next_retry_at = EXCLUDED.next_retry_at
    `;

    const params = [
      tx.id,
      tx.transaction.transactionId,
      tx.transaction.sourceChainId,
      tx.transaction.targetChainId,
      tx.transaction.token,
      tx.transaction.user,
      tx.transaction.amount.toString(),
      tx.transaction.nonce.toString(),
      tx.status,
      tx.retryCount,
      tx.maxRetries,
      tx.lastError || null,
      new Date(tx.createdAt),
      new Date(tx.updatedAt),
      tx.nextRetryAt ? new Date(tx.nextRetryAt) : null,
    ];

    await this.db.query(query, params);
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    id: string,
    status: TransactionStatus,
    completedTxHash?: string
  ): Promise<void> {
    const query = `
      UPDATE transactions
      SET status = $1, updated_at = $2, completed_tx_hash = $3
      WHERE id = $4
    `;

    await this.db.query(query, [status, new Date(), completedTxHash || null, id]);
  }

  /**
   * Get transaction by ID
   */
  async getById(id: string): Promise<any | null> {
    const query = 'SELECT * FROM transactions WHERE id = $1';
    const result = await this.db.query(query, [id]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get transactions by status
   */
  async getByStatus(status: TransactionStatus): Promise<any[]> {
    const query = 'SELECT * FROM transactions WHERE status = $1 ORDER BY created_at ASC';
    const result = await this.db.query(query, [status]);

    return result.rows;
  }

  /**
   * Get pending or retry-ready transactions
   */
  async getPendingOrRetryReady(): Promise<any[]> {
    const query = `
      SELECT * FROM transactions
      WHERE status = 'pending'
         OR (status = 'failed' AND retry_count < max_retries AND next_retry_at <= $1)
      ORDER BY created_at ASC
      LIMIT 100
    `;

    const result = await this.db.query(query, [new Date()]);
    return result.rows;
  }

  /**
   * Get transaction history for a user
   */
  async getByUser(userAddress: string, limit: number = 100): Promise<any[]> {
    const query = `
      SELECT * FROM transactions
      WHERE user_address = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [userAddress.toLowerCase(), limit]);
    return result.rows;
  }

  /**
   * Delete old completed transactions
   */
  async cleanupOldCompleted(olderThanMs: number = 86400000): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanMs);

    const query = `
      DELETE FROM transactions
      WHERE status = 'completed' AND updated_at < $1
    `;

    const result = await this.db.query(query, [cutoffDate]);
    return result.rowCount || 0;
  }

  /**
   * Get transaction statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM transactions
    `;

    const result = await this.db.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total, 10),
      pending: parseInt(row.pending, 10),
      processing: parseInt(row.processing, 10),
      completed: parseInt(row.completed, 10),
      failed: parseInt(row.failed, 10),
    };
  }
}
