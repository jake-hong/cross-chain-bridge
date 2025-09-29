#!/bin/bash

echo "Starting Cross-Chain Bridge Deployment"
echo "================================================================================================="

# Check if Ganache is running
echo "Checking network connections..."

# Check Ethereum network
if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://localhost:8545 > /dev/null 2>&1; then
    echo "Ethereum local network is running on port 8545"
else
    echo "Ethereum network not found. Please run: ./scripts/networks/ethereum-local.sh"
    exit 1
fi

# Check Polygon network
if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://localhost:8546 > /dev/null 2>&1; then
    echo "Polygon local network is running on port 8546"
else
    echo "Polygon network not found. Please run: ./scripts/networks/polygon-local.sh"
    exit 1
fi

echo ""
echo "Compiling contracts..."
forge build

echo ""
echo "Deploying contracts..."

# Deploy to both networks using Foundry script
forge script script/Deploy.s.sol:DeployScript \
    --broadcast \
    --private-key 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d \
    -vvv

echo ""
echo "Deployment completed!"
echo "================================================================================================="

# Save deployment addresses to file
echo "Saving deployment addresses..."
mkdir -p deployments

cat > deployments/local.json << EOF
{
  "ethereum": {
    "chainId": 1337,
    "rpcUrl": "http://localhost:8545",
    "contracts": {
      "mockToken": "Check broadcast logs",
      "bridge": "Check broadcast logs"
    }
  },
  "polygon": {
    "chainId": 1338,
    "rpcUrl": "http://localhost:8546",
    "contracts": {
      "bridge": "Check broadcast logs",
      "wrappedToken": "Check broadcast logs"
    }
  },
  "validators": [
    "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",
    "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d"
  ],
  "requiredSignatures": 2
}
EOF

echo "Deployment info saved to deployments/local.json"
echo ""
echo "Next steps:"
echo "   1. Check broadcast logs for contract addresses"
echo "   2. Update deployments/local.json with actual addresses"
echo "   3. Run bridge tests or relayer service"