export interface TokensLockedEvent {
  token: string;
  user: string;
  amount: bigint;
  targetChainId: bigint;
  nonce: bigint;
}

export interface TokensMintedEvent {
  token: string;
  user: string;
  amount: bigint;
  nonce: bigint;
}

export interface TokensUnlockedEvent {
  token: string;
  user: string;
  amount: bigint;
  nonce: bigint;
}

export interface BridgeEventData {
  event: 'TokensLocked' | 'TokensMinted' | 'TokensUnlocked';
  blockNumber: number;
  transactionHash: string;
  sourceChainId: number;
  targetChainId: number;
  data: TokensLockedEvent | TokensMintedEvent | TokensUnlockedEvent;
}
