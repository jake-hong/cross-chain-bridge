#!/bin/bash

echo "Verifying Cross-Chain Bridge Deployment"
echo "================================================================================================="

# Contract addresses from deployment
ETHEREUM_MOCK_TOKEN="0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"
ETHEREUM_BRIDGE="0x5b1869D9A4C187F2EAa108f3062412ecf0526b24"
POLYGON_BRIDGE="0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"
POLYGON_WRAPPED_TOKEN="0x5b1869D9A4C187F2EAa108f3062412ecf0526b24"

echo "Contract Addresses:"
echo "  Ethereum MockERC20: $ETHEREUM_MOCK_TOKEN"
echo "  Ethereum Bridge: $ETHEREUM_BRIDGE"
echo "  Polygon Bridge: $POLYGON_BRIDGE"
echo "  Polygon WrappedToken: $POLYGON_WRAPPED_TOKEN"
echo ""

# Check Ethereum contracts
echo "Checking Ethereum contracts..."
echo "MockERC20 name:"
cast call $ETHEREUM_MOCK_TOKEN "name()" --rpc-url http://localhost:8545

echo "MockERC20 symbol:"
cast call $ETHEREUM_MOCK_TOKEN "symbol()" --rpc-url http://localhost:8545

echo "MockERC20 total supply:"
cast call $ETHEREUM_MOCK_TOKEN "totalSupply()" --rpc-url http://localhost:8545

echo "Bridge isOriginChain:"
cast call $ETHEREUM_BRIDGE "isOriginChain()" --rpc-url http://localhost:8545

echo "Bridge requiredSignatures:"
cast call $ETHEREUM_BRIDGE "requiredSignatures()" --rpc-url http://localhost:8545

echo ""

# Check Polygon contracts
echo "Checking Polygon contracts..."
echo "Bridge isOriginChain:"
cast call $POLYGON_BRIDGE "isOriginChain()" --rpc-url http://localhost:8546

echo "WrappedToken name:"
cast call $POLYGON_WRAPPED_TOKEN "name()" --rpc-url http://localhost:8546

echo "WrappedToken symbol:"
cast call $POLYGON_WRAPPED_TOKEN "symbol()" --rpc-url http://localhost:8546

echo "WrappedToken bridge address:"
cast call $POLYGON_WRAPPED_TOKEN "bridge()" --rpc-url http://localhost:8546

echo ""
echo "Deployment verification completed!"