# Cross-Chain Bridge 🌉

**Enterprise-grade cross-chain bridge with KMS integration and multi-signature validation**

A production-ready bridge enabling secure asset transfers between EVM blockchains (Ethereum ↔ Polygon) with enterprise-level key management and automated relayer infrastructure.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

---

## 🎯 Key Features

- ✅ **Cross-Chain Asset Transfer**: Lock/Unlock on Ethereum, Mint/Burn on Polygon
- 🔐 **Enterprise KMS Integration**: HashiCorp Vault & AWS KMS support
- ✍️ **Multi-Signature Validation**: 2-of-3 validator consensus
- 🔄 **Automated Relayer Service**: Event-driven transaction processing with retry logic
- 📊 **PostgreSQL Persistence**: Transaction history and state management
- 🔑 **Key Rotation**: Zero-downtime validator key updates
- 🎨 **Modern Web3 UI**: React + Wagmi + RainbowKit

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                    (React + RainbowKit)                          │
└───────────────────────┬──────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐              ┌──────▼─────────┐
│   Ethereum     │              │    Polygon     │
│  Chain (1337)  │              │  Chain (1338)  │
│                │              │                │
│  ┌──────────┐  │              │  ┌──────────┐  │
│  │ Bridge   │  │              │  │ Bridge   │  │
│  │ Contract │  │              │  │ Contract │  │
│  └────┬─────┘  │              │  └────┬─────┘  │
│       │        │              │       │        │
│  ┌────▼─────┐  │              │  ┌────▼─────┐  │
│  │MockERC20 │  │              │  │ Wrapped  │  │
│  │  Token   │  │              │  │  Token   │  │
│  └──────────┘  │              │  └──────────┘  │
└────────┬───────┘              └────────┬───────┘
         │                               │
         │         Event Listener        │
         └───────────────┬───────────────┘
                         │
                 ┌───────▼────────┐
                 │   Relayer      │
                 │   Service      │
                 │                │
                 │ ┌────────────┐ │
                 │ │   Queue    │ │
                 │ │  Processor │ │
                 │ └────────────┘ │
                 │ ┌────────────┐ │
                 │ │    KMS     │ │
                 │ │  (Vault/   │ │
                 │ │    AWS)    │ │
                 │ └────────────┘ │
                 │ ┌────────────┐ │
                 │ │ PostgreSQL │ │
                 │ └────────────┘ │
                 └────────────────┘
```

### Components

1. **Smart Contracts** (`src/`)
   - `Bridge.sol`: Lock/unlock tokens, validate signatures
   - `WrappedToken.sol`: Mint/burn wrapped tokens
   - `MockERC20.sol`: Test token for local development

2. **Relayer Service** (`relayer/`)
   - Event listener for blockchain events
   - Transaction queue with exponential backoff retry
   - Multi-signature collection and verification
   - PostgreSQL for transaction persistence

3. **KMS Integration** (`relayer/src/kms/`)
   - HashiCorp Vault provider
   - AWS Secrets Manager + KMS provider
   - Automated key rotation with bridge updates

4. **Frontend** (`frontend/`)
   - React + TypeScript + Vite
   - Wagmi + RainbowKit for Web3
   - Real-time transaction status tracking

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for PostgreSQL & Vault)
- MetaMask browser extension

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend && npm install

# Relayer dependencies
cd ../relayer && npm install
```

### 2. Start Local Blockchains

```bash
# Terminal 1: Ethereum Local (port 8545)
npm run chain:eth

# Terminal 2: Polygon Local (port 8546)
npm run chain:poly
```

### 3. Deploy Contracts

```bash
# Deploy to both chains
npm run deploy:all
```

**Deployed Addresses:**
- Ethereum Bridge: `0x5b1869D9A4C187F2EAa108f3062412ecf0526b24`
- Polygon Bridge: `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`

### 4. Configure MetaMask

Add local networks:
- **Ethereum Local**: RPC `http://localhost:8545`, Chain ID `1337`
- **Polygon Local**: RPC `http://localhost:8546`, Chain ID `1338`

Import test account:
```
Private Key: 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

---

## 🧪 Testing

### Run Smart Contract Tests

```bash
# All tests
forge test

# Integration tests
forge test --match-contract BridgeIntegrationTest -vv

# Specific test
forge test --match-test testFullBridgeFlow_EthereumToPolygon -vvv
```

**Expected Output:**
```
[PASS] testFullBridgeFlow_EthereumToPolygon() (gas: 245960)
[PASS] testFullBridgeFlow_PolygonToEthereum() (gas: 240985)
[PASS] testInsufficientSignatures() (gas: 26180)
[PASS] testSignatureValidation() (gas: 137100)
```

### E2E Testing

See [E2E_TEST_GUIDE.md](./E2E_TEST_GUIDE.md) for detailed instructions.

---

## 🔐 KMS Setup

### HashiCorp Vault (Recommended for Self-Hosted)

```bash
cd relayer

# Start Vault
docker-compose up -d vault

# Initialize Vault (first time only)
./scripts/init-vault.sh

# Store a key
npm run store-key ethereum

# List keys
npm run list-keys

# Rotate key
npm run rotate-key ethereum --update-bridge
```

### AWS KMS

```bash
# Configure AWS credentials
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key

# Set KMS provider
export KMS_PROVIDER=aws

# Store key in AWS Secrets Manager
npm run store-key ethereum
```

---

## 📦 Project Structure

```
cross-chain-bridge/
├── src/                      # Smart contracts
│   ├── Bridge.sol
│   ├── WrappedToken.sol
│   └── MockERC20.sol
├── test/                     # Contract tests
│   ├── Bridge.t.sol
│   ├── BridgeIntegration.t.sol
│   └── WrappedToken.t.sol
├── script/                   # Deployment scripts
│   └── Deploy.s.sol
├── relayer/                  # Relayer service
│   ├── src/
│   │   ├── services/        # Event listener, transaction processing
│   │   ├── queue/           # Transaction queue with retry logic
│   │   ├── kms/             # KMS providers (Vault, AWS)
│   │   ├── database/        # PostgreSQL integration
│   │   └── scripts/         # CLI tools
│   └── docker-compose.yml   # PostgreSQL + Vault
└── frontend/                 # Web UI
    ├── src/
    │   ├── components/      # React components
    │   ├── config/          # Contract addresses, chains
    │   └── abis/            # Contract ABIs
    └── package.json
```

---

## 🔄 Bridge Flow

### Ethereum → Polygon (Lock & Mint)

1. **User**: Locks tokens on Ethereum Bridge
2. **Bridge**: Emits `TokensLocked` event
3. **Relayer**: Detects event via EventListener
4. **Validators**: Sign mint transaction (2-of-3)
5. **Relayer**: Submits signatures to Polygon Bridge
6. **Bridge**: Verifies signatures, mints wrapped tokens

### Polygon → Ethereum (Burn & Unlock)

1. **User**: Burns wrapped tokens on Polygon
2. **Bridge**: Emits `TokensBurned` event
3. **Relayer**: Detects event
4. **Validators**: Sign unlock transaction
5. **Relayer**: Submits to Ethereum Bridge
6. **Bridge**: Unlocks original tokens to user

---

## 🔑 Key Management

### Why KMS?

❌ **Without KMS:**
```typescript
// DANGEROUS: Private key in code/env
const privateKey = "0x1234..."; // Can be stolen!
```

✅ **With KMS:**
```typescript
// Secure: Key stored encrypted, access logged
const wallet = await kmsProvider.getWallet("ethereum");
```

**Benefits:**
- 🔒 Encryption at rest
- 📝 Access audit logs
- 🔄 Key rotation without downtime
- 👥 Multi-tenant support
- 🚨 Automatic alerts on unauthorized access

### Key Rotation

```bash
# 1. Generate new key in KMS
npm run rotate-key ethereum

# 2. Update Bridge contract validators
npm run rotate-key ethereum --update-bridge

# 3. Old key still works for 24h grace period
```

---

## 🛠️ Development

### Add a New Chain

1. **Deploy Bridge Contract:**
```solidity
Bridge newChainBridge = new Bridge(
    9999,  // new chain ID
    2,     // required signatures
    false  // not origin chain
);
```

2. **Update Frontend Config:**
```typescript
// frontend/src/config/chains.ts
export const newChain = defineChain({
  id: 9999,
  name: 'New Chain',
  rpcUrls: { default: { http: ['http://localhost:9999'] } },
});
```

3. **Update Relayer:**
```typescript
// relayer/src/config.ts
export const CHAINS = {
  newChain: { chainId: 9999, rpcUrl: 'http://localhost:9999' },
};
```

---

## 📊 Monitoring (Future Enhancement)

Planned features:
- Prometheus metrics
- Grafana dashboards
- Alert system for failed transactions
- Transaction analytics

---

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Start all services (PostgreSQL, Vault, Relayer)
docker-compose up -d

# View logs
docker-compose logs -f relayer

# Stop all services
docker-compose down
```

### Production Deployment

**1. Build Images:**
```bash
# Build relayer
docker build -t bridge-relayer:latest ./relayer

# Build frontend
docker build -t bridge-frontend:latest ./frontend
```

**2. Configure Environment:**
Create `.env` file:
```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLY_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
ETH_BRIDGE_ADDRESS=0x...
POLY_BRIDGE_ADDRESS=0x...
```

**3. Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline

GitHub Actions automatically:
- ✅ Runs smart contract tests on every PR
- ✅ Builds and tests relayer service
- ✅ Builds frontend
- ✅ Publishes Docker images on tag push
- ✅ Deploys to production on release

**Trigger deployment:**
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- [Foundry](https://book.getfoundry.sh/) - Smart contract development
- [OpenZeppelin](https://openzeppelin.com/) - Secure contract libraries
- [Wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection UI

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the decentralized future**
