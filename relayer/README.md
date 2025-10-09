# Bridge Relayer Service

Cross-chain bridge relayer service with HashiCorp Vault KMS integration.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- HashiCorp Vault (via Docker)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Vault
docker-compose up -d

# Initialize Vault (first time only)
./scripts/init-vault.sh
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run Relayer

```bash
# Development mode
npm run dev

# Build
npm run build

# Production mode
npm start
```

## Vault Access

- **UI**: http://localhost:8200
- **Token**: `dev-root-token` (development only)

## Database Access

- **Host**: localhost:5432
- **Database**: bridge_relayer
- **User/Password**: postgres/postgres

## KMS Key Management

### Supported KMS Providers

- **Vault** - HashiCorp Vault (recommended for self-hosted)
- **AWS** - AWS Secrets Manager + KMS (recommended for cloud)
- **Local** - In-memory storage (development only)

### Configuration

Set `KMS_PROVIDER` in `.env`:

```bash
# For Vault
KMS_PROVIDER=vault
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=dev-root-token

# For AWS
KMS_PROVIDER=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_KMS_KEY_ID=your-kms-key-id  # Optional: for encryption at rest

# For Local (dev only)
KMS_PROVIDER=local
```

### Store a new key

```bash
# Generate and store a new key
npm run store-key ethereum

# Or use an existing private key
npm run store-key ethereum 0x1234...
```

### List all keys

```bash
npm run list-keys
```

### Rotate a key

```bash
# Rotate key in KMS only
npm run rotate-key ethereum

# Rotate key and update Bridge contract
npm run rotate-key ethereum --update-bridge
```

## Architecture

```
[Blockchain Events] → [Event Listener] → [Transaction Queue] → [KMS Signer] → [Submit to Chain]
                                              ↓
                                         [PostgreSQL]
                                         [Vault KMS]
```
