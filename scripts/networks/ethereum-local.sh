#!/bin/bash

echo "🔷 Starting Local Ethereum Network (Ganache)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ganache \
  --chain.chainId 1337 \
  --server.host 0.0.0.0 \
  --server.port 8545 \
  --miner.blockGasLimit 12000000 \
  --accounts 10 \
  --account "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80,1000000000000000000000" \
  --account "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d,1000000000000000000000" \
  --account "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a,1000000000000000000000" \
  --account "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6,1000000000000000000000" \
  --account "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a,1000000000000000000000" \
  --deterministic

echo ""
echo "✅ Ethereum Local Network Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Network Name: Ethereum Local"
echo "🔗 Chain ID: 1337"
echo "🌍 RPC URL: http://localhost:8545"
echo "💰 Native Token: ETH"
echo ""
echo "👤 Test Accounts:"
echo "   Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (1000 ETH)"
echo "   Account #1: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (1000 ETH)"
echo "   Account #2: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc (1000 ETH)"
echo "   Account #3: 0x90f79bf6eb2c4f870365e785982e1f101e93b906 (1000 ETH)"
echo "   Account #4: 0x15d34aaf54267db7d7c367839aaf71a00a2c6a65 (1000 ETH)"
echo ""