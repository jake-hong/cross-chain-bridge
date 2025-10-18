import { useState, useEffect } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import type { Transaction } from '../types.ts';
import { contracts } from '../config/contracts';
import BridgeABI from '../abis/Bridge.json';
import './BridgeForm.css';

interface BridgeFormProps {
  onTransactionCreated: (tx: Transaction) => void;
}

export function BridgeForm({ onTransactionCreated }: BridgeFormProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [amount, setAmount] = useState('');
  const [targetChainId, setTargetChainId] = useState<number>(chainId === 1337 ? 1338 : 1337);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // When hash is received, create transaction
  useEffect(() => {
    if (hash && amount) {
      const tx: Transaction = {
        hash,
        status: 'pending',
        fromChain: chainId,
        toChain: targetChainId,
        amount,
        timestamp: Date.now(),
      };
      onTransactionCreated(tx);
    }
  }, [hash]);

  const handleTransfer = async () => {
    if (!isConnected || !amount || !address) {
      alert('Please connect wallet and enter amount');
      return;
    }

    try {
      // Get bridge address based on current chain
      const bridgeAddress = chainId === 1337
        ? contracts.ethereum.bridge
        : contracts.polygon.bridge;

      // Call lockTokens on the bridge contract
      writeContract({
        address: bridgeAddress,
        abi: BridgeABI.abi,
        functionName: 'lockTokens',
        args: [
          contracts.ethereum.mockToken, // token address
          parseEther(amount), // amount
          BigInt(targetChainId), // target chain ID
        ],
        value: parseEther(amount), // send ETH with transaction
      });

      setAmount('');
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. See console for details.');
    }
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
        disabled={!amount || chainId === targetChainId || isPending || isConfirming}
      >
        {isPending && 'Waiting for approval...'}
        {isConfirming && 'Confirming...'}
        {!isPending && !isConfirming && chainId === targetChainId && 'Select different chain'}
        {!isPending && !isConfirming && chainId !== targetChainId && 'Transfer'}
      </button>
    </div>
  );
}
