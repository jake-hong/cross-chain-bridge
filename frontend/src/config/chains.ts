import { defineChain } from 'viem';
import { sepolia, polygon } from 'viem/chains';

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

// 로컬 체인이 실행 중이지 않을 때는 테스트넷 사용
export const supportedChains = [sepolia, polygon];
