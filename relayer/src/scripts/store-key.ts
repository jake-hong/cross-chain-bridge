#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { KMSFactory } from '../kms/KMSFactory';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npm run store-key <chain-name> [private-key]');
    console.error('Example: npm run store-key ethereum');
    console.error('Example: npm run store-key ethereum 0x1234...');
    console.error('\nIf private-key is not provided, a new one will be generated');
    process.exit(1);
  }

  const chainName = args[0];
  const privateKey = args[1];

  console.log(`\n=== Storing Key for ${chainName} ===\n`);

  // Generate or use provided key
  let key: string;
  let address: string;

  if (privateKey) {
    key = privateKey;
    const wallet = new ethers.Wallet(key);
    address = wallet.address;
    console.log('Using provided private key');
  } else {
    const wallet = ethers.Wallet.createRandom();
    key = wallet.privateKey;
    address = wallet.address;
    console.log('Generated new private key');
  }

  console.log(`Address: ${address}`);

  // Initialize KMS
  const kms = KMSFactory.fromEnv();

  const keyId = `${chainName}-validator-key`;

  // Check if key already exists
  const exists = await kms.keyExists(keyId);
  if (exists) {
    console.error(`\nError: Key ${keyId} already exists!`);
    console.error('To rotate the key, use: npm run rotate-key');
    process.exit(1);
  }

  // Store key
  await kms.storeKey(keyId, key);

  console.log(`\nKey stored successfully!`);
  console.log(`Key ID: ${keyId}`);
  console.log(`Address: ${address}`);

  console.log('\nNext steps:');
  console.log(`1. Add this address as a validator in the Bridge contract: ${address}`);
  console.log(`2. Set USE_KMS=true in .env`);
  console.log(`3. Start the relayer`);

  console.log('\n=== Complete ===\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
