import dotenv from 'dotenv';
import { RelayerService } from './services/RelayerService';

// Load environment variables
dotenv.config();

async function main() {
  const relayer = new RelayerService();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await relayer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await relayer.stop();
    process.exit(0);
  });

  // Start the relayer
  await relayer.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
