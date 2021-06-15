import { ChainId, Token, Pair, TokenAmount, WETH } from '../src'

describe('Pair', () => {
  const USDC = new Token(ChainId.MATIC, '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', 18, 'USDC', 'USD Coin (PoS)')
  const DAI = new Token(ChainId.MATIC, '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', 18, 'DAI', '(PoS) Dai Stablecoin')


  describe('constructor', () => {
    it('cannot be used for tokens on different chains', () => {
      expect(() => new Pair(new TokenAmount(USDC, '100'), new TokenAmount(WETH[ChainId.OKEX], '100'))).toThrow(
        'CHAIN_IDS'
      )
    })
  })

  describe('#getAddress', () => {
    it('returns the correct address', () => {
      expect(Pair.getAddress(USDC, DAI)).toEqual('0xb7bd6d48C9b1aF7E126d0389C6970F157D974f33')
    })
  })

  // describe('#token0', () => {
  //   it('always is the token that sorts before', () => {
  //     expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).token0).toEqual(USDC)
  //     expect(new Pair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '100')).token0).toEqual(USDC)
  //   })
  // })
  // describe('#token1', () => {
  //   it('always is the token that sorts after', () => {
  //     expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).token1).toEqual(DAI)
  //     expect(new Pair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '100')).token1).toEqual(DAI)
  //   })
  // })
  // describe('#reserve0', () => {
  //   it('always comes from the token that sorts before', () => {
  //     expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '101')).reserve0).toEqual(
  //       new TokenAmount(USDC, '100')
  //     )
  //     expect(new Pair(new TokenAmount(DAI, '101'), new TokenAmount(USDC, '100')).reserve0).toEqual(
  //       new TokenAmount(USDC, '100')
  //     )
  //   })
  // })
  // describe('#reserve1', () => {
  //   it('always comes from the token that sorts after', () => {
  //     expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '101')).reserve1).toEqual(
  //       new TokenAmount(DAI, '101')
  //     )
  //     expect(new Pair(new TokenAmount(DAI, '101'), new TokenAmount(USDC, '100')).reserve1).toEqual(
  //       new TokenAmount(DAI, '101')
  //     )
  //   })
  // })

  // describe('#token0Price', () => {
  //   it('returns price of token0 in terms of token1', () => {
  //     expect(new Pair(new TokenAmount(USDC, '101'), new TokenAmount(DAI, '100')).token0Price).toEqual(
  //       new Price(DAI, USDC, '100', '101')
  //     )
  //     expect(new Pair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '101')).token0Price).toEqual(
  //       new Price(DAI, USDC, '100', '101')
  //     )
  //   })
  // })

  // describe('#token1Price', () => {
  //   it('returns price of token1 in terms of token0', () => {
  //     expect(new Pair(new TokenAmount(USDC, '101'), new TokenAmount(DAI, '100')).token1Price).toEqual(
  //       new Price(USDC, DAI, '101', '100')
  //     )
  //     expect(new Pair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '101')).token1Price).toEqual(
  //       new Price(USDC, DAI, '101', '100')
  //     )
  //   })
  // })

  // describe('#priceOf', () => {
  //   const pair = new Pair(new TokenAmount(USDC, '101'), new TokenAmount(DAI, '100'))
  //   it('returns price of token in terms of other token', () => {
  //     expect(pair.priceOf(DAI)).toEqual(pair.token0Price)
  //     expect(pair.priceOf(USDC)).toEqual(pair.token1Price)
  //   })

  //   it('throws if invalid token', () => {
  //     expect(() => pair.priceOf(WETH[ChainId.MATIC])).toThrow('TOKEN')
  //   })
  // })

  // describe('#reserveOf', () => {
  //   it('returns reserves of the given token', () => {
  //     expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '101')).reserveOf(USDC)).toEqual(
  //       new TokenAmount(USDC, '100')
  //     )
  //     expect(new Pair(new TokenAmount(DAI, '101'), new TokenAmount(USDC, '100')).reserveOf(USDC)).toEqual(
  //       new TokenAmount(USDC, '100')
  //     )
  //   })

  //   it('throws if not in the pair', () => {
  //     expect(() =>
  //       new Pair(new TokenAmount(DAI, '101'), new TokenAmount(USDC, '100')).reserveOf(WETH[ChainId.MATIC])
  //     ).toThrow('TOKEN')
  //   })
  // })

  // describe('#chainId', () => {
  //   it('returns the token0 chainId', () => {
  //     expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).chainId).toEqual(ChainId.MATIC)
  //     expect(new Pair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '100')).chainId).toEqual(ChainId.MATIC)
  //   })
  // })
  // describe('#involvesToken', () => {
  //   expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).involvesToken(USDC)).toEqual(true)
  //   expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).involvesToken(DAI)).toEqual(true)
  //   expect(
  //     new Pair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).involvesToken(WETH[ChainId.MATIC])
  //   ).toEqual(false)
  // })
})
