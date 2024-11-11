import invariant from 'tiny-invariant'
import { ChainId } from '../constants'
import { validateAndParseAddress } from '../utils'
import { Currency } from './currency'

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends Currency {
  public readonly chainId: ChainId
  public readonly address: string

  public constructor(chainId: ChainId, address: string, decimals: number, symbol?: string, name?: string) {
    super(decimals, symbol, name)
    this.chainId = chainId
    this.address = validateAndParseAddress(address)
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   * @param other other token to compare
   */
  public equals(other: Token): boolean {
    // short circuit on reference equality
    if (this === other) {
      return true
    }
    return this.chainId === other.chainId && this.address === other.address
  }

  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  public sortsBefore(other: Token): boolean {
    invariant(this.chainId === other.chainId, 'CHAIN_IDS')
    invariant(this.address !== other.address, 'ADDRESSES')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }
}

/**
 * Compares two currencies for equality
 */
export function currencyEquals(currencyA: Currency, currencyB: Currency): boolean {
  if (currencyA instanceof Token && currencyB instanceof Token) {
    return currencyA.equals(currencyB)
  } else if (currencyA instanceof Token) {
    return false
  } else if (currencyB instanceof Token) {
    return false
  } else {
    return currencyA === currencyB
  }
}

export const WETH = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.ROPSTEN]: new Token(
    ChainId.ROPSTEN,
    '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.RINKEBY]: new Token(
    ChainId.RINKEBY,
    '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', 18, 'WETH', 'Wrapped Ether'),
  [ChainId.KOVAN]: new Token(ChainId.KOVAN, '0xd0A1E359811322d97991E03f863a0C30C2cF029C', 18, 'WETH', 'Wrapped Ether'),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    '0x4c28f48448720e9000907BC2611F73022fdcE1fA',
    18,
    'WMATIC',
    'Wrapped Matic'
  ),
  [ChainId.OKEX]: new Token(
    ChainId.OKEX,
    '0x8F8526dbfd6E38E3D8307702cA8469Bae6C56C15',
    18,
    'WOKT',
    'Wrapped OKExChain'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    18,
    'WETH',
    'Wrapped ETH'
  ),
  [ChainId.BSC]: new Token(
    ChainId.BSC,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'WBNB',
    'Wrapped BNB'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    18,
    'WFTM',
    'Wrapped FTM'
  ),
  [ChainId.HARMONY]: new Token(
    ChainId.HARMONY,
    '0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a',
    18,
    'WONE',
    'Wrapped ONE'
  ),
  [ChainId.XDAI]: new Token(
    ChainId.XDAI,
    '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    18,
    'WXDAI',
    'Wrapped xDai'
  )
  ,
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    18,
    'XAVAX',
    'Wrapped AVAX'
  ),
  [ChainId.MUMBAI]: new Token(ChainId.MUMBAI, '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889', 18, 'WMATIC', 'Wrapped Matic'),
  [ChainId.FUJI]: new Token(ChainId.FUJI, '0xd00ae08403B9bbb9124bB305C09058E32C39A48c', 18, 'WAVAX', 'Wrapped AVAX'),
  [ChainId.ARBITRUM_RINKEBY]: new Token(ChainId.ARBITRUM_RINKEBY, '0xb47e6a5f8b33b3f17603c83a0535a9dcd7e32681', 18, 'WETH', 'Wrapped Ether'),
  [ChainId.FANTOM_TESTNET]: new Token(ChainId.FANTOM_TESTNET, '0xf1277d1Ed8AD466beddF92ef448A132661956621', 18, 'WFTM', 'Wrapped FTM'),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
  [ChainId.OPTIMISM_KOVAN]: new Token(ChainId.OPTIMISM_KOVAN, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
  [ChainId.CRONOS]: new Token(ChainId.CRONOS, '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23', 18, 'WCRO', 'Wrapped CRONOS'),
  [ChainId.AURORA]: new Token(ChainId.AURORA, '0xc9bdeed33cd01541e1eed10f90519d2c06fe3feb', 18, 'WETH', 'Wrapped Ether'),
  [ChainId.SHARDEUM]: new Token(ChainId.SHARDEUM, '0x0000000000000000000000000000000000000000', 18, 'WSHM', 'Wrapped SHM'),
  [ChainId.KAVA]: new Token(ChainId.KAVA, '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b', 18, 'WKAVA', 'Wrapped KAVA'),
  [ChainId.MOONBEAM]: new Token(ChainId.MOONBEAM, '0xAcc15dC74880C9944775448304B263D191c6077F', 18, 'WGLMR', 'Wrapped GLMR'),
  [ChainId.SAAKURA]: new Token(ChainId.SAAKURA, '0x557a526472372f1F222EcC6af8818C1e6e78A85f', 18, 'WOAS', 'Wrapped OAS'),
  [ChainId.MATCHAIN]: new Token(ChainId.MATCHAIN, '0x4200000000000000000000000000000000000006', 18, 'WBNB', 'Wrapped BNB'),
  [ChainId.VANAR]: new Token(ChainId.VANAR, "0x3F59B60748f001bd53cb96A81F148e438227B0F4", 18, "WVANRY", "Wrapped VANRY"),
  [ChainId.BLAST]: new Token(ChainId.BLAST, "0x4300000000000000000000000000000000000004", 18, "WETH", "Wrapped Ether"),
}
