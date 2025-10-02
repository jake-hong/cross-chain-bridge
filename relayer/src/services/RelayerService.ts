import { EventListener } from './EventListener';
import { BridgeEventData } from '../types/events';
import { CHAIN_CONFIGS } from '../config/chains';

export class RelayerService {
  private listeners: Map<string, EventListener> = new Map();

  async start(): Promise<void> {
    console.log('Starting Relayer Service...');

    // Initialize event listeners for all chains
    for (const [chainName, config] of Object.entries(CHAIN_CONFIGS)) {
      const listener = new EventListener(config);
      this.listeners.set(chainName, listener);

      // Catch up on missed events first
      await listener.catchUp(this.handleEvent.bind(this));

      // Start listening for new events
      await listener.start(this.handleEvent.bind(this));
    }

    console.log('Relayer Service started successfully');
  }

  async stop(): Promise<void> {
    console.log('Stopping Relayer Service...');

    for (const listener of this.listeners.values()) {
      await listener.stop();
    }

    this.listeners.clear();
    console.log('Relayer Service stopped');
  }

  private async handleEvent(event: BridgeEventData): Promise<void> {
    console.log('Received event:', {
      type: event.event,
      chain: event.sourceChainId,
      block: event.blockNumber,
      tx: event.transactionHash,
    });

    try {
      switch (event.event) {
        case 'TokensLocked':
          await this.handleTokensLocked(event);
          break;
        case 'TokensMinted':
          console.log('TokensMinted event processed (confirmation)');
          break;
        case 'TokensUnlocked':
          console.log('TokensUnlocked event processed (confirmation)');
          break;
        default:
          console.warn('Unknown event type:', event.event);
      }
    } catch (error) {
      console.error('Error handling event:', error);
      // TODO: Add to retry queue
    }
  }

  private async handleTokensLocked(event: BridgeEventData): Promise<void> {
    console.log('Processing TokensLocked event:', event);
    // TODO: Build and submit mint transaction to destination chain
    // This will be implemented in the next phase
  }
}
