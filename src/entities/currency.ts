import JSBI from 'jsbi'

import { ChainId, SolidityType } from '../constants'
import { validateSolidityTypeInstance } from '../utils'

/**
 * A currency is any fungible financial instrument on Ethereum, including Ether and all ERC20 tokens.
 *
 * The only instance of the base class `Currency` is Ether.
 */
export class Currency {
  public readonly decimals: number
  public readonly symbol?: string
  public readonly name?: string

  public readonly usd?: string

  public static readonly ETHER: Currency = new Currency(18, 'ETH', 'Ether')

  public static readonly MATIC: Currency = new Currency(18, 'MATIC', 'Matic')

  public static readonly OKT: Currency = new Currency(18, 'OKT', 'OKExChain')
  public static readonly XDAI: Currency = new Currency(18, 'XDAI', 'xDai')
  public static readonly ONE: Currency = new Currency(18, 'ONE', 'Harmony')
  public static readonly BNB: Currency = new Currency(18, 'BNB', 'Binance Coin')
  public static readonly FTM: Currency = new Currency(18, 'FTM', 'Fantom')
  public static readonly AVAX: Currency = new Currency(18, 'AVAX', 'Avalanche')
  public static readonly CRO: Currency = new Currency(18, 'CRO', 'CRONOS')
  public static readonly SHM: Currency = new Currency(18, 'SHM', 'Shardeum')
  public static readonly KAVA: Currency = new Currency(18, 'KAVA', 'Kava')
  public static readonly GLMR: Currency = new Currency(18, 'GLMR', 'Moonbeam')
  public static readonly OAS: Currency = new Currency(18, 'OAS', 'Oasys')
  public static readonly VANARY: Currency = new Currency(18, 'VANARY', 'Vanary')

  public static readonly NATIVE = {
    [ChainId.MAINNET]: Currency.ETHER,
    [ChainId.ROPSTEN]: Currency.ETHER,
    [ChainId.RINKEBY]: Currency.ETHER,
    [ChainId.GÖRLI]: Currency.ETHER,
    [ChainId.KOVAN]: Currency.ETHER,
    [ChainId.MATIC]: Currency.MATIC,
    [ChainId.OKEX]: Currency.OKT,
    [ChainId.ARBITRUM]: Currency.ETHER,
    [ChainId.XDAI]: Currency.XDAI,
    [ChainId.BSC]: Currency.BNB,
    [ChainId.FANTOM]: Currency.FTM,
    [ChainId.HARMONY]: Currency.ONE,
    [ChainId.AVALANCHE]: Currency.AVAX,
    [ChainId.MUMBAI]: Currency.MATIC,
    [ChainId.FUJI]: Currency.AVAX,
    [ChainId.ARBITRUM_RINKEBY]: Currency.ETHER,
    [ChainId.FANTOM_TESTNET]: Currency.FTM,
    [ChainId.OPTIMISM]: Currency.ETHER,
    [ChainId.OPTIMISM_KOVAN]: Currency.ETHER,
    [ChainId.CRONOS]: Currency.CRO,
    [ChainId.AURORA]: Currency.ETHER,
    [ChainId.SHARDEUM]: Currency.SHM,
    [ChainId.KAVA]: Currency.KAVA,
    [ChainId.MOONBEAM]: Currency.GLMR,
    [ChainId.SAAKURA]: Currency.OAS,
    [ChainId.MATCHAIN]: Currency.BNB,
    [ChainId.VANAR]: Currency.VANARY,
    [ChainId.BLAST]: Currency.ETHER,
  }

  /**
   * Constructs an instance of the base class `Currency`. The only instance of the base class `Currency` is `Currency.ETHER`.
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   */
  constructor(decimals: number, symbol?: string, name?: string) {
    validateSolidityTypeInstance(JSBI.BigInt(decimals), SolidityType.uint8)

    this.decimals = decimals
    this.symbol = symbol
    this.name = name
  }

  public static getNativeCurrency(chainId?: ChainId) {
    if (!chainId) {
      throw Error(`No chainId ${chainId}`)
    }

    if (!(chainId in Currency.NATIVE)) {
      throw Error(`No native currency defined for chainId ${chainId}`)
    }
    return Currency.NATIVE[chainId]
  }

  public static getNativeCurrencySymbol(chainId?: ChainId) {
    const nativeCurrency = this.getNativeCurrency(chainId)
    return nativeCurrency.symbol
  }

  public static getNativeCurrencyName(chainId?: ChainId) {
    const nativeCurrency = this.getNativeCurrency(chainId)
    return nativeCurrency.name
  }

  public getSymbol(chainId?: ChainId) {
    if (!chainId) {
      return this?.symbol
    }

    if (this?.symbol === 'ETH') {
      return Currency.getNativeCurrencySymbol(chainId)
    }

    return this?.symbol
  }

  public getName(chainId?: ChainId) {
    if (!chainId) {
      return this?.name
    }

    if (this?.name === 'Ether') {
      return Currency.getNativeCurrencyName(chainId)
    }

    return this?.name
  }
}

const NATIVE = Currency.ETHER

export { NATIVE }
