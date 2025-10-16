export type TransactionStatus = 'pending' | 'confirming' | 'completed' | 'failed';

export type Transaction = {
  hash: string;
  status: TransactionStatus;
  fromChain: number;
  toChain: number;
  amount: string;
  timestamp: number;
};
