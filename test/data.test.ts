import { ChainId, WETH, Token, Fetcher } from '../src'

// TODO: replace the provider in these tests
describe('data', () => {
  // it('Token', async () => {
  //   const token = await Fetcher.fetchTokenData(ChainId.MATIC, '0x4c28f48448720e9000907bc2611f73022fdce1fa') // DAI
  //   expect(token.decimals).toEqual(18)
  // })

  // it('Token:CACHE', async () => {
  //   const token = await Fetcher.fetchTokenData(ChainId.MATIC, '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619') // DGD
  //   expect(token.decimals).toEqual(9)
  // })

  it('Pair', async () => {
    const token = new Token(ChainId.MATIC, '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 18) // DAI
    const pair = await Fetcher.fetchPairData(WETH[ChainId.MATIC], token)
    expect(pair.liquidityToken.address).toEqual('0xC3379226AEeF21464d05676305dad1261D6F3FAC')
  })
})
