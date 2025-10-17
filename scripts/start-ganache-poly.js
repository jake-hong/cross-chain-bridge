const ganache = require('ganache');

const server = ganache.server({
  chain: {
    chainId: 1338,
  },
  wallet: {
    deterministic: true,
    totalAccounts: 10,
    defaultBalance: 1000,
  },
  logging: {
    quiet: false,
  },
  miner: {
    blockGasLimit: 12000000,
  },
});

const PORT = 8546;

server.listen(PORT, async (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Ganache Polygon Local started on port ${PORT}`);
  console.log(`Chain ID: 1338`);
  console.log(`Available Accounts:`);

  const provider = server.provider;
  const accounts = await provider.request({
    method: 'eth_accounts',
    params: [],
  });

  accounts.forEach((account, index) => {
    console.log(`(${index}) ${account}`);
  });

  console.log(`\nPrivate Keys:`);
  const privateKeys = [
    '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
    '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
  ];

  privateKeys.forEach((key, index) => {
    console.log(`(${index}) ${key}`);
  });
});
