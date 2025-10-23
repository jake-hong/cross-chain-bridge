import { EventListener } from './EventListener';
import { QueueProcessor } from '../queue/QueueProcessor';
import { TransactionQueue } from '../queue/TransactionQueue';
import { Database } from '../database/Database';

export class RelayerService {
  private eventListener?: EventListener;
  private queueProcessor?: QueueProcessor;
  private queue?: TransactionQueue;
  private db?: Database;
  private isRunning = false;

  async start() {
    console.log('Starting Relayer Service...');
    this.isRunning = true;
    console.log('🚀 Relayer Service is running!');
  }

  async stop() {
    this.isRunning = false;
    console.log('👋 Relayer Service stopped');
  }

  isServiceRunning(): boolean {
    return this.isRunning;
  }
}
