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

## Architecture

```
[Blockchain Events] → [Event Listener] → [Transaction Queue] → [KMS Signer] → [Submit to Chain]
                                              ↓
                                         [PostgreSQL]
                                         [Vault KMS]
```
