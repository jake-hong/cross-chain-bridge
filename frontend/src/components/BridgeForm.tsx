import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import type { Transaction } from '../types.ts';
import './BridgeForm.css';

interface BridgeFormProps {
  onTransactionCreated: (tx: Transaction) => void;
}

export function BridgeForm({ onTransactionCreated }: BridgeFormProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [amount, setAmount] = useState('');
  const [targetChainId, setTargetChainId] = useState<number>(chainId === 1337 ? 1338 : 1337);

  const handleTransfer = async () => {
    if (!isConnected || !amount) {
      alert('Please connect wallet and enter amount');
      return;
    }

    // Create mock transaction for demo
    const mockTx: Transaction = {
      hash: '0x' + Math.random().toString(16).substring(2, 66),
      status: 'pending',
      fromChain: chainId,
      toChain: targetChainId,
      amount,
      timestamp: Date.now(),
    };

    onTransactionCreated(mockTx);
    setAmount('');

    // TODO: Implement actual bridge transfer logic
  };

  if (!isConnected) {
    return (
      <div className="bridge-form">
        <p>Please connect your wallet to use the bridge</p>
      </div>
    );
  }

  return (
    <div className="bridge-form">
      <h2>Transfer Tokens</h2>

      <div className="form-group">
        <label>From Chain</label>
        <div className="chain-display">
          {chainId === 1337 ? 'Ethereum Local' : 'Polygon Local'} (Chain ID: {chainId})
        </div>
      </div>

      <div className="form-group">
        <label>To Chain</label>
        <select
          value={targetChainId}
          onChange={(e) => setTargetChainId(Number(e.target.value))}
          className="chain-select"
        >
          <option value={1337}>Ethereum Local (1337)</option>
          <option value={1338}>Polygon Local (1338)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Amount (ETH)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="amount-input"
          step="0.01"
          min="0"
        />
      </div>

      <button
        onClick={handleTransfer}
        className="transfer-button"
        disabled={!amount || chainId === targetChainId}
      >
        {chainId === targetChainId ? 'Select different chain' : 'Transfer'}
      </button>
    </div>
  );
}
