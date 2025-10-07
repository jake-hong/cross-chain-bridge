#!/bin/bash

# Wait for Vault to be ready
echo "Waiting for Vault to be ready..."
sleep 3

# Enable KV secrets engine
docker exec bridge_relayer_vault vault secrets enable -path=secret kv-v2

# Store a test secret
docker exec bridge_relayer_vault vault kv put secret/relayer/test key=test-value

echo "Vault initialized successfully!"
echo "Access Vault UI at: http://localhost:8200"
echo "Root Token: dev-root-token"
