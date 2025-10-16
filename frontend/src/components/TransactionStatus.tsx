import type { Transaction } from '../types.ts';
import './TransactionStatus.css';

interface TransactionStatusProps {
  transaction: Transaction | null;
}

export function TransactionStatus({ transaction }: TransactionStatusProps) {
  if (!transaction) {
    return null;
  }

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending...';
      case 'confirming':
        return 'Confirming...';
      case 'completed':
        return 'Completed ✓';
      case 'failed':
        return 'Failed ✗';
    }
  };

  const getStatusClass = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
      case 'confirming':
        return 'status-processing';
      case 'completed':
        return 'status-success';
      case 'failed':
        return 'status-failed';
    }
  };

  return (
    <div className="transaction-status">
      <h3>Transaction Status</h3>

      <div className="status-card">
        <div className="status-row">
          <span className="status-label">Status:</span>
          <span className={`status-value ${getStatusClass(transaction.status)}`}>
            {getStatusText(transaction.status)}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">Hash:</span>
          <span className="status-value hash">
            {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">Amount:</span>
          <span className="status-value">{transaction.amount} ETH</span>
        </div>

        <div className="status-row">
          <span className="status-label">From:</span>
          <span className="status-value">
            Chain {transaction.fromChain}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">To:</span>
          <span className="status-value">
            Chain {transaction.toChain}
          </span>
        </div>
      </div>
    </div>
  );
}
