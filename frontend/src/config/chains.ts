import { defineChain } from 'viem';

export const localhost1 = defineChain({
  id: 1337,
  name: 'Ethereum Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
});

export const localhost2 = defineChain({
  id: 1338,
  name: 'Polygon Local',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8546'] },
  },
});

export const supportedChains = [localhost1, localhost2];
