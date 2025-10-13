export interface Transaction {
  hash: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  fromChain: number;
  toChain: number;
  amount: string;
  timestamp: number;
}
