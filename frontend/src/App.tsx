import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BridgeForm } from './components/BridgeForm'
import { TransactionStatus } from './components/TransactionStatus'
import { Transaction } from './types/transaction'
import './App.css'

function App() {
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null)

  const handleTransactionCreated = (tx: Transaction) => {
    setCurrentTransaction(tx)

    // Simulate transaction status updates
    setTimeout(() => {
      setCurrentTransaction((prev) => prev ? { ...prev, status: 'confirming' } : null)
    }, 2000)

    setTimeout(() => {
      setCurrentTransaction((prev) => prev ? { ...prev, status: 'completed' } : null)
    }, 5000)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Cross-Chain Bridge</h1>
        <ConnectButton />
      </header>
      <main>
        <BridgeForm onTransactionCreated={handleTransactionCreated} />
        <TransactionStatus transaction={currentTransaction} />
      </main>
    </div>
  )
}

export default App
