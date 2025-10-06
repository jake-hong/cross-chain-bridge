import { Database } from './Database';
import { BridgeEventData } from '../types/events';

export class EventRepository {
  constructor(private db: Database) {}

  /**
   * Save an event to the database
   */
  async save(event: BridgeEventData): Promise<void> {
    const query = `
      INSERT INTO event_logs (
        event_type, chain_id, block_number, transaction_hash,
        log_index, event_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (chain_id, transaction_hash, log_index) DO NOTHING
    `;

    const params = [
      event.event,
      event.sourceChainId,
      event.blockNumber,
      event.transactionHash,
      0, // log_index (simplified, could be extracted from event)
      JSON.stringify(event.data),
    ];

    await this.db.query(query, params);
  }

  /**
   * Get events by chain and block range
   */
  async getByChainAndBlockRange(
    chainId: number,
    fromBlock: number,
    toBlock: number
  ): Promise<any[]> {
    const query = `
      SELECT * FROM event_logs
      WHERE chain_id = $1 AND block_number >= $2 AND block_number <= $3
      ORDER BY block_number ASC, log_index ASC
    `;

    const result = await this.db.query(query, [chainId, fromBlock, toBlock]);
    return result.rows;
  }

  /**
   * Get last processed block for a chain
   */
  async getLastProcessedBlock(chainId: number): Promise<number> {
    const query = `
      SELECT last_processed_block FROM relayer_state WHERE chain_id = $1
    `;

    const result = await this.db.query(query, [chainId]);

    if (result.rows.length > 0) {
      return parseInt(result.rows[0].last_processed_block, 10);
    }

    return 0;
  }

  /**
   * Update last processed block for a chain
   */
  async updateLastProcessedBlock(chainId: number, blockNumber: number): Promise<void> {
    const query = `
      INSERT INTO relayer_state (chain_id, last_processed_block, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (chain_id) DO UPDATE SET
        last_processed_block = EXCLUDED.last_processed_block,
        updated_at = EXCLUDED.updated_at
    `;

    await this.db.query(query, [chainId, blockNumber, new Date()]);
  }
}
