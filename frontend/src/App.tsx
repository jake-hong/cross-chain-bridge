import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BridgeForm } from './components/BridgeForm'
import { TransactionStatus } from './components/TransactionStatus'
import { TransactionHistory } from './components/TransactionHistory'
import type { Transaction } from './types.ts'
import './App.css'

function App() {
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null)
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([])

  const handleTransactionCreated = (tx: Transaction) => {
    setCurrentTransaction(tx)
    setTransactionHistory((prev) => [tx, ...prev])

    // Simulate transaction status updates
    setTimeout(() => {
      setCurrentTransaction((prev) => {
        if (!prev) return null
        const updated = { ...prev, status: 'confirming' as const }
        setTransactionHistory((history) =>
          history.map((t) => (t.hash === tx.hash ? updated : t))
        )
        return updated
      })
    }, 2000)

    setTimeout(() => {
      setCurrentTransaction((prev) => {
        if (!prev) return null
        const updated = { ...prev, status: 'completed' as const }
        setTransactionHistory((history) =>
          history.map((t) => (t.hash === tx.hash ? updated : t))
        )
        return updated
      })
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
        <TransactionHistory transactions={transactionHistory} />
      </main>
    </div>
  )
}

export default App
