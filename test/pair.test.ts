import { ChainId, Token, Pair, TokenAmount, WETH, Price } from '../src'

describe('Pair', () => {
  const ETH = new Token(ChainId.MATIC, '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 18, 'ETH', 'Ether (Wrapped)')
  const DFYN = new Token(ChainId.MATIC, '0xC168E40227E4ebD8C1caE80F7a55a4F0e6D66C97', 18, 'DFYN', 'DFYN TOKEN (PoS)')

  describe('constructor', () => {
    it('cannot be used for tokens on different chains', () => {
      expect(() => new Pair(new TokenAmount(ETH, '100'), new TokenAmount(WETH[ChainId.MATIC], '100'))).toThrow(
        'CHAIN_IDS'
      )
    })
  })

  // describe('#getAddress', () => {
  //   it('returns the correct address', () => {
  //     expect(Pair.getAddress(ETH, DFYN)).toEqual('0x6fA867BBFDd025780a8CFE988475220AfF51FB8b')
  //   })
  // })

  // describe('#token0', () => {
  //   it('always is the token that sorts before', () => {
  //     expect(new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '100')).token0).toEqual(DFYN)
  //     expect(new Pair(new TokenAmount(DFYN, '100'), new TokenAmount(ETH, '100')).token0).toEqual(DFYN)
  //   })
  // })
  // describe('#token1', () => {
  //   it('always is the token that sorts after', () => {
  //     expect(new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '100')).token1).toEqual(ETH)
  //     expect(new Pair(new TokenAmount(DFYN, '100'), new TokenAmount(ETH, '100')).token1).toEqual(ETH)
  //   })
  // })
  // describe('#reserve0', () => {
  //   it('always comes from the token that sorts before', () => {
  //     expect(new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '101')).reserve0).toEqual(
  //       new TokenAmount(DFYN, '101')
  //     )
  //     expect(new Pair(new TokenAmount(DFYN, '101'), new TokenAmount(ETH, '100')).reserve0).toEqual(
  //       new TokenAmount(DFYN, '101')
  //     )
  //   })
  // })
  // describe('#reserve1', () => {
  //   it('always comes from the token that sorts after', () => {
  //     expect(new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '101')).reserve1).toEqual(
  //       new TokenAmount(ETH, '100')
  //     )
  //     expect(new Pair(new TokenAmount(DFYN, '101'), new TokenAmount(ETH, '100')).reserve1).toEqual(
  //       new TokenAmount(ETH, '100')
  //     )
  //   })
  // })

  // describe('#token0Price', () => {
  //   it('returns price of token0 in terms of token1', () => {
  //     expect(new Pair(new TokenAmount(ETH, '101'), new TokenAmount(DFYN, '100')).token0Price).toEqual(
  //       new Price(DFYN, ETH, '100', '101')
  //     )
  //     expect(new Pair(new TokenAmount(DFYN, '100'), new TokenAmount(ETH, '101')).token0Price).toEqual(
  //       new Price(DFYN, ETH, '100', '101')
  //     )
  //   })
  // })

  // describe('#token1Price', () => {
  //   it('returns price of token1 in terms of token0', () => {
  //     expect(new Pair(new TokenAmount(ETH, '101'), new TokenAmount(DFYN, '100')).token1Price).toEqual(
  //       new Price(ETH, DFYN, '101', '100')
  //     )
  //     expect(new Pair(new TokenAmount(DFYN, '100'), new TokenAmount(ETH, '101')).token1Price).toEqual(
  //       new Price(ETH, DFYN, '101', '100')
  //     )
  //   })
  // })

  // describe('#priceOf', () => {
  //   const pair = new Pair(new TokenAmount(ETH, '101'), new TokenAmount(DFYN, '100'))
  //   it('returns price of token in terms of other token', () => {
  //     expect(pair.priceOf(DFYN)).toEqual(pair.token0Price)
  //     expect(pair.priceOf(ETH)).toEqual(pair.token1Price)
  //   })

  //   it('throws if invalid token', () => {
  //     expect(() => pair.priceOf(WETH[ChainId.MATIC])).toThrow('TOKEN')
  //   })
  // })

  // describe('#reserveOf', () => {
  //   it('returns reserves of the given token', () => {
  //     expect(new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '101')).reserveOf(ETH)).toEqual(
  //       new TokenAmount(ETH, '100')
  //     )
  //     expect(new Pair(new TokenAmount(DFYN, '101'), new TokenAmount(ETH, '100')).reserveOf(ETH)).toEqual(
  //       new TokenAmount(ETH, '100')
  //     )
  //   })

  //   it('throws if not in the pair', () => {
  //     expect(() =>
  //       new Pair(new TokenAmount(DFYN, '101'), new TokenAmount(ETH, '100')).reserveOf(WETH[ChainId.MATIC])
  //     ).toThrow('TOKEN')
  //   })
  // })

  // describe('#chainId', () => {
  //   it('returns the token0 chainId', () => {
  //     expect(new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '100')).chainId).toEqual(ChainId.MATIC)
  //     expect(new Pair(new TokenAmount(DFYN, '100'), new TokenAmount(ETH, '100')).chainId).toEqual(ChainId.MATIC)
  //   })
  // })
  // describe('#involvesToken', () => {
  //   expect(new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '100')).involvesToken(ETH)).toEqual(true)
  //   expect(new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '100')).involvesToken(DFYN)).toEqual(true)
  //   expect(
  //     new Pair(new TokenAmount(ETH, '100'), new TokenAmount(DFYN, '100')).involvesToken(WETH[ChainId.MATIC])
  //   ).toEqual(false)
  // })
})
