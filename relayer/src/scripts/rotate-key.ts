#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { KMSFactory } from '../kms/KMSFactory';
import { KeyRotationManager } from '../kms/KeyRotationManager';
import BridgeABI from '../abis/Bridge.json';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npm run rotate-key <chain-name> [--update-bridge]');
    console.error('Example: npm run rotate-key ethereum');
    console.error('Example: npm run rotate-key ethereum --update-bridge');
    process.exit(1);
  }

  const chainName = args[0];
  const updateBridge = args.includes('--update-bridge');

  console.log(`\n=== Key Rotation for ${chainName} ===\n`);

  // Initialize KMS
  const kms = KMSFactory.fromEnv();
  const rotationManager = new KeyRotationManager(kms);

  const keyId = `${chainName}-validator-key`;

  if (updateBridge) {
    // Update Bridge contract
    const bridgeAddress = process.env[`${chainName.toUpperCase()}_BRIDGE_ADDRESS`];
    const rpcUrl = process.env[`${chainName.toUpperCase()}_RPC_URL`];
    const ownerPrivateKey = process.env.BRIDGE_OWNER_PRIVATE_KEY;

    if (!bridgeAddress || !rpcUrl || !ownerPrivateKey) {
      console.error('Missing configuration:');
      console.error(`  ${chainName.toUpperCase()}_BRIDGE_ADDRESS=${bridgeAddress}`);
      console.error(`  ${chainName.toUpperCase()}_RPC_URL=${rpcUrl}`);
      console.error(`  BRIDGE_OWNER_PRIVATE_KEY=${ownerPrivateKey ? 'SET' : 'NOT SET'}`);
      process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);

    await rotationManager.rotateKeyWithBridgeUpdate({
      keyId,
      bridgeAddress,
      bridgeABI: BridgeABI,
      ownerWallet,
    });
  } else {
    // Just rotate the key in KMS
    const result = await rotationManager.rotateKey(keyId);

    console.log('\nKey rotated successfully!');
    console.log('Next steps:');
    console.log(`1. Update Bridge contract to add new validator: ${result.newAddress}`);
    console.log(`2. Remove old validator from Bridge contract: ${result.oldAddress}`);
    console.log('\nOr run with --update-bridge flag to do this automatically');
  }

  console.log('\n=== Rotation Complete ===\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
