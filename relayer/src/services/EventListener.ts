import { ethers } from 'ethers';
import { ChainConfig } from '../config/chains';
import { BridgeEventData, TokensLockedEvent } from '../types/events';
import BridgeABI from '../abis/Bridge.json';

export class EventListener {
  private provider: ethers.JsonRpcProvider;
  private bridge: ethers.Contract;
  private config: ChainConfig;
  private lastProcessedBlock: number;

  constructor(config: ChainConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.bridge = new ethers.Contract(
      config.bridgeAddress,
      BridgeABI,
      this.provider
    );
    this.lastProcessedBlock = config.startBlock;
  }

  async start(onEvent: (event: BridgeEventData) => Promise<void>): Promise<void> {
    console.log(`Starting event listener for ${this.config.name} (Chain ID: ${this.config.chainId})`);

    // Listen to TokensLocked events (for origin chain)
    this.bridge.on('TokensLocked', async (token, user, amount, targetChainId, nonce, event) => {
      const eventData: BridgeEventData = {
        event: 'TokensLocked',
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
        sourceChainId: this.config.chainId,
        targetChainId: Number(targetChainId),
        data: {
          token,
          user,
          amount,
          targetChainId,
          nonce,
        } as TokensLockedEvent,
      };

      await onEvent(eventData);
    });

    // Listen to TokensMinted events (for destination chain)
    this.bridge.on('TokensMinted', async (token, user, amount, nonce, event) => {
      const eventData: BridgeEventData = {
        event: 'TokensMinted',
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
        sourceChainId: this.config.chainId,
        targetChainId: this.config.chainId, // Same chain for minted events
        data: {
          token,
          user,
          amount,
          nonce,
        },
      };

      await onEvent(eventData);
    });

    // Listen to TokensUnlocked events (for origin chain)
    this.bridge.on('TokensUnlocked', async (token, user, amount, nonce, event) => {
      const eventData: BridgeEventData = {
        event: 'TokensUnlocked',
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
        sourceChainId: this.config.chainId,
        targetChainId: this.config.chainId, // Same chain for unlocked events
        data: {
          token,
          user,
          amount,
          nonce,
        },
      };

      await onEvent(eventData);
    });

    console.log(`Event listener started for ${this.config.name}`);
  }

  async stop(): Promise<void> {
    this.bridge.removeAllListeners();
    console.log(`Event listener stopped for ${this.config.name}`);
  }

  async catchUp(onEvent: (event: BridgeEventData) => Promise<void>): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();

    if (this.lastProcessedBlock >= currentBlock) {
      return;
    }

    console.log(`Catching up events from block ${this.lastProcessedBlock} to ${currentBlock} on ${this.config.name}`);

    // Query past TokensLocked events
    const lockedFilter = this.bridge.filters.TokensLocked();
    const lockedEvents = await this.bridge.queryFilter(
      lockedFilter,
      this.lastProcessedBlock,
      currentBlock
    );

    for (const log of lockedEvents) {
      if (!('args' in log)) continue;

      const args = log.args as any;
      const eventData: BridgeEventData = {
        event: 'TokensLocked',
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        sourceChainId: this.config.chainId,
        targetChainId: Number(args.targetChainId),
        data: {
          token: args.token,
          user: args.user,
          amount: args.amount,
          targetChainId: args.targetChainId,
          nonce: args.nonce,
        } as TokensLockedEvent,
      };

      await onEvent(eventData);
    }

    this.lastProcessedBlock = currentBlock;
  }

  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }
}
