import { Transaction } from '../types/transaction';
import './TransactionHistory.css';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="transaction-history">
        <h3>Transaction History</h3>
        <p className="empty-message">No transactions yet</p>
      </div>
    );
  }

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirming':
        return 'Confirming';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
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

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="transaction-history">
      <h3>Transaction History</h3>
      <div className="history-list">
        {transactions.map((tx) => (
          <div key={tx.hash} className="history-item">
            <div className="history-header">
              <span className="tx-hash">
                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
              </span>
              <span className={`tx-status ${getStatusClass(tx.status)}`}>
                {getStatusText(tx.status)}
              </span>
            </div>
            <div className="history-details">
              <span className="detail-item">
                {tx.amount} ETH
              </span>
              <span className="detail-item">
                Chain {tx.fromChain} → {tx.toChain}
              </span>
              <span className="detail-item timestamp">
                {formatTimestamp(tx.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
