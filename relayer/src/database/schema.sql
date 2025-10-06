-- Transaction history table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL,
    source_chain_id INTEGER NOT NULL,
    target_chain_id INTEGER NOT NULL,
    token_address VARCHAR(42) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    amount VARCHAR(78) NOT NULL,
    nonce VARCHAR(78) NOT NULL,
    status VARCHAR(20) NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_retry_at TIMESTAMP,
    completed_tx_hash VARCHAR(66),
    CONSTRAINT status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_source_chain ON transactions(source_chain_id);
CREATE INDEX IF NOT EXISTS idx_transactions_target_chain ON transactions(target_chain_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Event logs table
CREATE TABLE IF NOT EXISTS event_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    chain_id INTEGER NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chain_id, transaction_hash, log_index)
);

-- Index for event logs
CREATE INDEX IF NOT EXISTS idx_event_logs_chain_block ON event_logs(chain_id, block_number);
CREATE INDEX IF NOT EXISTS idx_event_logs_type ON event_logs(event_type);

-- Relayer state table (for tracking last processed block per chain)
CREATE TABLE IF NOT EXISTS relayer_state (
    chain_id INTEGER PRIMARY KEY,
    last_processed_block BIGINT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
