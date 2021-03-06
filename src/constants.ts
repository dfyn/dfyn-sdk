import JSBI from 'jsbi'

// exports for external consumption
export type BigintIsh = JSBI | bigint | string

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GÖRLI = 5,
  KOVAN = 42,
  MATIC = 137,
  OKEX = 66,
  ARBITRUM = 42161,
  FANTOM = 250,
  XDAI = 100,
  BSC = 56,
  HARMONY = 1666600000,
  AVALANCHE = 43114
}

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT
}

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP
}

export const FACTORY_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
  [ChainId.ROPSTEN]: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  [ChainId.RINKEBY]: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  [ChainId.GÖRLI]: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  [ChainId.KOVAN]: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  [ChainId.MATIC]: '0xE7Fb3e833eFE5F9c441105EB65Ef8b261266423B',
  [ChainId.OKEX]: '0xE7Fb3e833eFE5F9c441105EB65Ef8b261266423B',
  [ChainId.ARBITRUM]: '0xa102072a4c07f06ec3b4900fdc4c7b80b6c57429',
  [ChainId.XDAI]: '0x4c28f48448720e9000907BC2611F73022fdcE1fA',
  [ChainId.FANTOM]: '0xd9820a17053d6314B20642E465a84Bf01a3D64f5',
  [ChainId.HARMONY]: '0xd9820a17053d6314B20642E465a84Bf01a3D64f5',
  [ChainId.BSC]: '0xd9820a17053d6314B20642E465a84Bf01a3D64f5',
  [ChainId.AVALANCHE]: '0xd9820a17053d6314B20642E465a84Bf01a3D64f5',
}

export const ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  [ChainId.RINKEBY]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  [ChainId.ROPSTEN]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  [ChainId.GÖRLI]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  [ChainId.KOVAN]: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  [ChainId.MATIC]: '0xA102072A4C07F06EC3B4900FDC4C7B80b6c57429',
  [ChainId.OKEX]: '0x34686CBF7229ed0bff2Fbe7ED2CFC916317764f6',
  [ChainId.ARBITRUM]: '0xaedE1EFe768bD8A1663A7608c63290C60B85e71c',
  [ChainId.XDAI]: '0xE7Fb3e833eFE5F9c441105EB65Ef8b261266423B',
  [ChainId.FANTOM]: '0x2724B9497b2cF3325C6BE3ea430b3cec34B5Ef2d',
  [ChainId.HARMONY]: '0x8973792d9E8EA794E546b62c0f2295e32a6d7E48',
  [ChainId.BSC]: '0x2724B9497b2cF3325C6BE3ea430b3cec34B5Ef2d',
  [ChainId.AVALANCHE]: '0x4c28f48448720e9000907BC2611F73022fdcE1fA',
}

// export const INIT_CODE_HASH = '0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3'
export const INIT_CODE_HASH: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3',
  [ChainId.RINKEBY]: '0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3',
  [ChainId.ROPSTEN]: '0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3',
  [ChainId.GÖRLI]: '0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3',
  [ChainId.KOVAN]: '0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3',
  [ChainId.MATIC]: '0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3',
  [ChainId.OKEX]: '0xd9fecb0a9f5bfd6ce2daf90b441ed5860c3fed2fcde57ba9819eb98d2422e418',
  [ChainId.ARBITRUM]: '0xd49917af2b31d70ba7bea89230a93b55d3b6a99aacd03a72c288dfe524ec2f36',
  [ChainId.XDAI]: '0xd3ab2c392f54feb4b3b2a677f449b133c188ad2f1015eff3e94ea9315282c5f5',
  [ChainId.FANTOM]: '0xd3ab2c392f54feb4b3b2a677f449b133c188ad2f1015eff3e94ea9315282c5f5',
  [ChainId.HARMONY]: '0xd3ab2c392f54feb4b3b2a677f449b133c188ad2f1015eff3e94ea9315282c5f5',
  [ChainId.BSC]: '0xd3ab2c392f54feb4b3b2a677f449b133c188ad2f1015eff3e94ea9315282c5f5',
  [ChainId.AVALANCHE]: '0x512ce213a92fcce51fda9ba8738d5584ab111453ad8da5d2bd7d36bc97d14b5c',
}




export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const FIVE = JSBI.BigInt(5)
export const TEN = JSBI.BigInt(10)
export const _100 = JSBI.BigInt(100)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)

export enum SolidityType {
  uint8 = 'uint8',
  uint256 = 'uint256'
}

export const SOLIDITY_TYPE_MAXIMA = {
  [SolidityType.uint8]: JSBI.BigInt('0xff'),
  [SolidityType.uint256]: JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
}
