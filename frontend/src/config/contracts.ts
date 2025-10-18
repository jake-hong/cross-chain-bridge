// Contract addresses from deployment
export const contracts = {
  ethereum: {
    chainId: 1337,
    bridge: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24' as `0x${string}`,
    mockToken: '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab' as `0x${string}`,
  },
  polygon: {
    chainId: 1338,
    bridge: '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab' as `0x${string}`,
    wrappedToken: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24' as `0x${string}`,
  },
} as const;
