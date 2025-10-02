export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  bridgeAddress: string;
  startBlock: number;
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  ethereum: {
    chainId: 1337, // Local Ganache Ethereum
    name: 'Ethereum Local',
    rpcUrl: process.env.ETH_RPC_URL || 'http://localhost:8545',
    bridgeAddress: process.env.ETH_BRIDGE_ADDRESS || '',
    startBlock: 0,
  },
  polygon: {
    chainId: 1338, // Local Ganache Polygon
    name: 'Polygon Local',
    rpcUrl: process.env.POLY_RPC_URL || 'http://localhost:8546',
    bridgeAddress: process.env.POLY_BRIDGE_ADDRESS || '',
    startBlock: 0,
  },
};
