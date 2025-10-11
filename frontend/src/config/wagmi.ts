import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { supportedChains } from './chains';

export const config = getDefaultConfig({
  appName: 'Cross-Chain Bridge',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: supportedChains as any,
  ssr: false,
});
