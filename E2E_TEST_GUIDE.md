# E2E Testing Guide

This guide will walk you through testing the entire cross-chain bridge flow from start to finish.

## Prerequisites

- Node.js 18+
- MetaMask browser extension
- Terminal (3 tabs recommended)

## Step 1: Start Local Blockchains

### Terminal 1: Ethereum Local Chain
```bash
npm run chain:eth
```

You should see:
```
Ganache Ethereum Local started on port 8545
Chain ID: 1337
Available Accounts:
(0) 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
...
Private Keys:
(0) 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
```

### Terminal 2: Polygon Local Chain
```bash
npm run chain:poly
```

You should see:
```
Ganache Polygon Local started on port 8546
Chain ID: 1338
...
```

## Step 2: Deploy Smart Contracts

### Terminal 3: Deploy to both chains
```bash
npm run deploy:all
```

You should see deployment addresses:
```
Ethereum Network (Chain ID: 1337)
  MockERC20: 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab
  Bridge: 0x5b1869D9A4C187F2EAa108f3062412ecf0526b24

Polygon Network (Chain ID: 1338)
  Bridge: 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab
  WrappedToken: 0x5b1869D9A4C187F2EAa108f3062412ecf0526b24
```

## Step 3: Configure MetaMask

### Add Ethereum Local Network
1. Open MetaMask
2. Click Networks → Add Network → Add a network manually
3. Enter:
   - **Network Name**: Ethereum Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH

### Add Polygon Local Network
1. Click Networks → Add Network → Add a network manually
2. Enter:
   - **Network Name**: Polygon Local
   - **RPC URL**: http://localhost:8546
   - **Chain ID**: 1338
   - **Currency Symbol**: MATIC

### Import Test Account
1. Click account icon → Import Account
2. Select "Private Key"
3. Paste: `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d`
4. This account has 1000 ETH on both local chains

## Step 4: Start Frontend

### Terminal 3 (or new terminal):
```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## Step 5: Test Bridge Transaction

### 5.1: Connect Wallet
1. Click "Connect Wallet" button
2. Select MetaMask
3. Approve connection
4. Make sure you're on "Ethereum Local" network

### 5.2: Send Bridge Transaction
1. Enter amount: `0.1` ETH
2. Select destination: "Polygon Local (1338)"
3. Click "Transfer"
4. Approve MetaMask transaction
5. Wait for confirmation

### 5.3: Verify Transaction
You should see:
- Transaction status changes: Pending → Confirming → Completed
- Transaction appears in history
- Your balance decreased on Ethereum Local

### 5.4: Check on Polygon
1. Switch MetaMask to "Polygon Local" network
2. (In future: wrapped tokens should appear in your balance)

## Step 6: Run Contract Tests

To verify the contracts work correctly:

```bash
forge test --match-contract BridgeIntegrationTest -vv
```

Expected output:
```
[PASS] testFullBridgeFlow_EthereumToPolygon() (gas: 245960)
[PASS] testFullBridgeFlow_PolygonToEthereum() (gas: 240985)
[PASS] testInsufficientSignatures() (gas: 26180)
[PASS] testSignatureValidation() (gas: 137100)
```

## Troubleshooting

### MetaMask shows "Nonce too high" error
- Reset account: MetaMask → Settings → Advanced → Clear activity tab data

### Frontend shows blank screen
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- Check console for errors
- Make sure both Ganache chains are running

### Transaction fails immediately
- Make sure you're on the correct network (Ethereum Local for sending)
- Check that contracts are deployed (see Step 2)
- Verify you have enough ETH balance

## Success Criteria

✅ Local chains running on ports 8545 and 8546
✅ Contracts deployed successfully
✅ MetaMask connected to local networks
✅ Frontend loads without errors
✅ Can send bridge transaction
✅ Transaction appears in history with correct status
✅ Integration tests pass

## Next Steps

After successful E2E testing:
1. Test relayer service (monitors events and processes transactions)
2. Add transaction history persistence
3. Implement wrapped token balance display
