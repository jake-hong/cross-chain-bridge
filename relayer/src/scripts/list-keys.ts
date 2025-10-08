#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { KMSFactory } from '../kms/KMSFactory';

dotenv.config();

async function main() {
  console.log('\n=== Listing All Keys in KMS ===\n');

  // Initialize KMS
  const kms = KMSFactory.fromEnv();

  // List all keys
  const keys = await kms.listKeys();

  if (keys.length === 0) {
    console.log('No keys found in KMS');
    console.log('\nTo store a key, use: npm run store-key <chain-name>');
    return;
  }

  console.log(`Found ${keys.length} keys:\n`);

  for (const keyId of keys) {
    try {
      const privateKey = await kms.getKey(keyId);
      const wallet = new ethers.Wallet(privateKey);
      console.log(`- ${keyId}`);
      console.log(`  Address: ${wallet.address}`);
      console.log('');
    } catch (error: any) {
      console.log(`- ${keyId}`);
      console.log(`  Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('=== Complete ===\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
