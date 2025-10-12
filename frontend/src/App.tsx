import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BridgeForm } from './components/BridgeForm'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Cross-Chain Bridge</h1>
        <ConnectButton />
      </header>
      <main>
        <BridgeForm />
      </main>
    </div>
  )
}

export default App
