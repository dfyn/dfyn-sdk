import {  CurrencyAmount, Fraction, Percent, Price, TradeType, wrappedCurrency } from '../index'
import { Pair, Route as V1RouteSDK, Trade as V1TradeSDK } from '../index'
import { Pool, V2Route as V2RouteSDK, V2Trade as V2TradeSDK } from '../index'
import invariant from 'tiny-invariant'
import { ONE, ZERO } from '../constants'
import { MixedRouteSDK } from './mixedRoute/route'
import { MixedRouteTrade as MixedRouteTradeSDK } from './mixedRoute/trade'
import { IRoute, MixedRoute, RouteV1, RouteV2, RouteUniV2 } from './RouteWrappers'

export class MixedTrade {
  public readonly routes: IRoute[]
  public readonly tradeType: TradeType
  private _outputAmount: CurrencyAmount | undefined
  private _inputAmount: CurrencyAmount | undefined

  /**
   * The swaps of the trade, i.e. which routes and how much is swapped in each that
   * make up the trade. May consist of swaps in v1 or v2.
   */
  public readonly swaps: {
    route: IRoute
    inputAmount: CurrencyAmount
    outputAmount: CurrencyAmount
  }[]

  //  construct a trade across v1 and v2 routes from pre-computed amounts
  public constructor({
    v1Routes,
    v2Routes,
    uniV3Routes,
    tradeType,
    mixedRoutes,
  }: {
    v1Routes: {
      routev1: V1RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[]
    v2Routes: {
      routev2: V2RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[]
    uniV3Routes: {
      routeUniV3: V2RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[]
    tradeType: TradeType
    mixedRoutes?: {
      mixedRoute: MixedRouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[]
  }) {
    this.swaps = []
    this.routes = []
    // wrap v1 routes
    for (const { routev1, inputAmount, outputAmount } of v1Routes) {
      const route = new RouteV1(routev1)
      this.routes.push(route)
      this.swaps.push({
        route,
        inputAmount,
        outputAmount,
      })
    }
    // wrap v2 routes
    for (const { routev2, inputAmount, outputAmount } of v2Routes) {
      const route = new RouteV2(routev2)
      this.routes.push(route)
      this.swaps.push({
        route,
        inputAmount,
        outputAmount,
      })
    }
    // wrap univ3 routes
    for (const { routeUniV3, inputAmount, outputAmount } of uniV3Routes) {
      const route = new RouteUniV2(routeUniV3)
      this.routes.push(route)
      this.swaps.push({
        route,
        inputAmount,
        outputAmount,
      })
    }
    // wrap mixedRoutes
    if (mixedRoutes) {
      for (const { mixedRoute, inputAmount, outputAmount } of mixedRoutes) {
        const route = new MixedRoute(mixedRoute)
        this.routes.push(route)
        this.swaps.push({
          route,
          inputAmount,
          outputAmount,
        })
      }
    }
    this.tradeType = tradeType

    // each route must have the same input and output currency
    const inputCurrency = this.swaps[0].inputAmount.currency
    const outputCurrency = this.swaps[0].outputAmount.currency
    invariant(
      this.swaps.every(({ route }) => {
        const chainId=route.pools[0].chainId
        return wrappedCurrency(inputCurrency,chainId).equals(wrappedCurrency(route.input,chainId))}),
      'INPUT_CURRENCY_MATCH'
    )
    invariant(
      this.swaps.every(({ route }) => {
        const chainId=route.pools[0].chainId
        return wrappedCurrency(outputCurrency,chainId).equals(wrappedCurrency(route.output,chainId))}),
      'OUTPUT_CURRENCY_MATCH'
    )

    // pools must be unique inter protocols
    const numPools = this.swaps.map(({ route }) => route.pools.length).reduce((total, cur) => total + cur, 0)
    const poolAddressSet = new Set<string>()
    for (const { route } of this.swaps) {
      for (const pool of route.pools) {
        if (pool instanceof Pool) {
          poolAddressSet.add(Pool.getAddress(pool.token0, pool.token1))
        } else if (pool instanceof Pair) {
          const pair = pool
          poolAddressSet.add(Pair.getAddress(pair.token0, pair.token1))
        } else {
          throw new Error('Unexpected pool type in route when constructing trade object')
        }
      }
    }
    invariant(numPools == poolAddressSet.size, 'POOLS_DUPLICATED')
  }

  public get inputAmount(): CurrencyAmount {
    if (this._inputAmount) {
      return this._inputAmount
    }

    const inputCurrency = this.swaps[0].inputAmount.currency
    const totalInputFromRoutes = this.swaps
      .map(({ inputAmount }) => inputAmount)
      .reduce((total, cur) => total.add(cur), new CurrencyAmount(inputCurrency, 0))

    this._inputAmount = totalInputFromRoutes
    return this._inputAmount
  }

  public get outputAmount(): CurrencyAmount {
    if (this._outputAmount) {
      return this._outputAmount
    }

    const outputCurrency = this.swaps[0].outputAmount.currency
    const totalOutputFromRoutes = this.swaps
      .map(({ outputAmount }) => outputAmount)
      .reduce((total, cur) => total.add(cur), new CurrencyAmount(outputCurrency, 0))

    this._outputAmount = totalOutputFromRoutes
    return this._outputAmount
  }

  private _executionPrice: Price | undefined

  /**
   * The price expressed in terms of output amount/input amount.
   */
  public get executionPrice(): Price {
    return (
      this._executionPrice ??
      (this._executionPrice = new Price(
        this.inputAmount.currency,
        this.outputAmount.currency,
        this.inputAmount.raw,
        this.outputAmount.raw
      ))
    )
  }

  /**
   * The cached result of the price impact computation
   * @private
   */
  private _priceImpact: Percent | undefined
  /**
   * Returns the percent difference between the route's mid price and the price impact
   */
  public get priceImpact(): Percent {
    if (this._priceImpact) {
      return this._priceImpact
    }

    let spotOutputAmount = new CurrencyAmount(this.outputAmount.currency, 0)
    for (const { route, inputAmount } of this.swaps) {
      const midPrice = route.midPrice
      spotOutputAmount = spotOutputAmount.add(midPrice.quote(inputAmount))
    }

    const priceImpact = spotOutputAmount.subtract(this.outputAmount).divide(spotOutputAmount)
    this._priceImpact = new Percent(priceImpact.numerator, priceImpact.denominator)

    return this._priceImpact
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount out
   */
  public minimumAmountOut(slippageTolerance: Percent, amountOut = this.outputAmount): CurrencyAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return amountOut
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(amountOut.raw).quotient
      return new CurrencyAmount(amountOut.currency, slippageAdjustedAmountOut)
    }
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount in
   */
  public maximumAmountIn(slippageTolerance: Percent, amountIn = this.inputAmount): CurrencyAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return amountIn
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE).add(slippageTolerance).multiply(amountIn.raw).quotient
      return new CurrencyAmount(amountIn.currency, slippageAdjustedAmountIn)
    }
  }

  /**
   * Return the execution price after accounting for slippage tolerance
   * @param slippageTolerance the allowed tolerated slippage
   * @returns The execution price
   */
  public worstExecutionPrice(slippageTolerance: Percent): Price {
    return new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.maximumAmountIn(slippageTolerance).raw,
      this.minimumAmountOut(slippageTolerance).raw
    )
  }

  public static async fromRoutes(
    v1Routes: {
      routev1: V1RouteSDK
      amount: TradeType extends TradeType.EXACT_INPUT ? CurrencyAmount : CurrencyAmount
    }[],
    v2Routes: {
      routev2: V2RouteSDK
      amount: TradeType extends TradeType.EXACT_INPUT ? CurrencyAmount : CurrencyAmount
    }[],
    uniV3Routes: {
      routeUniV3: V2RouteSDK
      amount: TradeType extends TradeType.EXACT_INPUT ? CurrencyAmount : CurrencyAmount
    }[],
    tradeType: TradeType,
    mixedRoutes?: {
      mixedRoute: MixedRouteSDK
      amount: TradeType extends TradeType.EXACT_INPUT ? CurrencyAmount : CurrencyAmount
    }[]
  ): Promise<MixedTrade> {
    const populatedV1Routes: {
      routev1: V1RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    const populatedV2Routes: {
      routev2: V2RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    const populatedUniV3Routes: {
      routeUniV3: V2RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    const populatedMixedRoutes: {
      mixedRoute: MixedRouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    for (const { routev1, amount } of v1Routes) {
      const v1Trade = new V1TradeSDK(routev1, amount, tradeType)
      const { inputAmount, outputAmount } = v1Trade

      populatedV1Routes.push({
        routev1,
        inputAmount,
        outputAmount,
      })
    }

    for (const { routev2, amount } of v2Routes) {
      const v2Trade = await V2TradeSDK.fromRoute(routev2, amount, tradeType)
      const { inputAmount, outputAmount } = v2Trade

      populatedV2Routes.push({
        routev2,
        inputAmount,
        outputAmount,
      })
    }

    for (const { routeUniV3, amount } of uniV3Routes) {
      const v2Trade = await V2TradeSDK.fromRoute(routeUniV3, amount, tradeType)
      const { inputAmount, outputAmount } = v2Trade

      populatedUniV3Routes.push({
        routeUniV3,
        inputAmount,
        outputAmount,
      })
    }

    if (mixedRoutes) {
      for (const { mixedRoute, amount } of mixedRoutes) {
        const mixedRouteTrade = await MixedRouteTradeSDK.fromRoute(mixedRoute, amount, tradeType)
        const { inputAmount, outputAmount } = mixedRouteTrade

        populatedMixedRoutes.push({
          mixedRoute,
          inputAmount,
          outputAmount,
        })
      }
    }

    return new MixedTrade({
      v1Routes: populatedV1Routes,
      v2Routes: populatedV2Routes,
      uniV3Routes: populatedUniV3Routes,
      mixedRoutes: populatedMixedRoutes,
      tradeType,
    })
  }

  public static async fromRoute(
    route: V1RouteSDK | V2RouteSDK | MixedRouteSDK,
    amount: TradeType extends TradeType.EXACT_INPUT ? CurrencyAmount : CurrencyAmount,
    tradeType: TradeType
  ): Promise<MixedTrade> {
    let v1Routes: {
      routev1: V1RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    let v2Routes: {
      routev2: V2RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    let uniV3Routes: {
      routeUniV3: V2RouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    let mixedRoutes: {
      mixedRoute: MixedRouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    if (route instanceof V1RouteSDK) {
      const v1Trade = new V1TradeSDK(route, amount, tradeType)
      const { inputAmount, outputAmount } = v1Trade
      v1Routes = [{ routev1: route, inputAmount, outputAmount }]
    } else if (route instanceof V2RouteSDK) {
      const v2Trade = await V2TradeSDK.fromRoute(route, amount, tradeType)
      const { inputAmount, outputAmount } = v2Trade
      v2Routes = [{ routev2: route, inputAmount, outputAmount }]
    } else if (route instanceof MixedRouteSDK) {
      const mixedRouteTrade = await MixedRouteTradeSDK.fromRoute(route, amount, tradeType)
      const { inputAmount, outputAmount } = mixedRouteTrade
      mixedRoutes = [{ mixedRoute: route, inputAmount, outputAmount }]
    } else {
      throw new Error('Invalid route type')
    }

    return new MixedTrade({
      v1Routes,
      v2Routes,
      uniV3Routes,
      mixedRoutes,
      tradeType,
    })
  }
}