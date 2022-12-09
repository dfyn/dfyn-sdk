import { Currency, Fraction, Percent, Price,  CurrencyAmount, wrappedCurrency,wrappedAmount,TokenAmount,Pair,Pool,BestTradeOptions } from '../index'
import invariant from 'tiny-invariant'
import { ONE, ZERO,TradeType } from '../../constants'
import { MixedRouteSDK } from './route'
import { sortedInsert } from '../../index';

/**
 * Trades comparator, an extension of the input output comparator that also considers other dimensions of the trade in ranking them
 * @template TInput The input token, either Ether or an ERC-20
 * @template TOutput The output token, either Ether or an ERC-20
 * @template TradeType The trade type, either exact input or exact output
 * @param a The first trade to compare
 * @param b The second trade to compare
 * @returns A sorted ordering for two neighboring elements in a trade array
 */
export function mixedTradeComparator(
  a: MixedRouteTrade,
  b: MixedRouteTrade
) {
  // must have same input and output token for comparison
 const chainId= a.route.chainId;
  invariant(wrappedCurrency(a.inputAmount.currency,chainId).equals(wrappedCurrency(b.inputAmount.currency,chainId)), 'INPUT_CURRENCY')
  invariant(wrappedCurrency(a.outputAmount.currency,chainId).equals(wrappedCurrency(b.outputAmount.currency,chainId)), 'OUTPUT_CURRENCY')
  if (a.outputAmount.equalTo(b.outputAmount)) {
    if (a.inputAmount.equalTo(b.inputAmount)) {
      // consider the number of hops since each hop costs gas
      const aHops = a.swaps.reduce((total, cur) => total + cur.route.path.length, 0)
      const bHops = b.swaps.reduce((total, cur) => total + cur.route.path.length, 0)
      return aHops - bHops
    }
    // trade A requires less input than trade B, so A should come first
    if (a.inputAmount.lessThan(b.inputAmount)) {
      return -1
    } else {
      return 1
    }
  } else {
    // tradeA has less output than trade B, so should come second
    if (a.outputAmount.lessThan(b.outputAmount)) {
      return 1
    } else {
      return -1
    }
  }
}

/**
 * Represents a trade executed against a set of routes where some percentage of the input is
 * split across each route.
 *
 * Each route has its own set of pools. Pools can not be re-used across routes.
 *
 * Does not account for slippage, i.e., changes in price environment that can occur between
 * the time the trade is submitted and when it is executed.
 * @notice This class is functionally the same as the `Trade` class in the `@uniswap/v3-sdk` package, aside from typing and some input validation.
 * @template TInput The input token, either Ether or an ERC-20
 * @template TOutput The output token, either Ether or an ERC-20
 * @template TradeType The trade type, either exact input or exact output
 */
export class MixedRouteTrade {
  /**
   * @deprecated Deprecated in favor of 'swaps' property. If the trade consists of multiple routes
   * this will return an error.
   *
   * When the trade consists of just a single route, this returns the route of the trade,
   * i.e. which pools the trade goes through.
   */
  public get route(): MixedRouteSDK {
    invariant(this.swaps.length == 1, 'MULTIPLE_ROUTES')
    return this.swaps[0].route
  }

  /**
   * The swaps of the trade, i.e. which routes and how much is swapped in each that
   * make up the trade.
   */
  public readonly swaps: {
    route: MixedRouteSDK
    inputAmount: CurrencyAmount
    outputAmount: CurrencyAmount
  }[]

  /**
   * The type of the trade, either exact in or exact out.
   */
  public readonly tradeType: TradeType

  /**
   * The cached result of the input amount computation
   * @private
   */
  private _inputAmount: CurrencyAmount | undefined

  /**
   * The input amount for the trade assuming no slippage.
   */
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

  /**
   * The cached result of the output amount computation
   * @private
   */
  private _outputAmount: CurrencyAmount | undefined

  /**
   * The output amount for the trade assuming no slippage.
   */
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

  /**
   * The cached result of the computed execution price
   * @private
   */
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
        this.inputAmount.quotient,
        this.outputAmount.quotient
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
   * Constructs a trade by simulating swaps through the given route
   * @template TInput The input token, either Ether or an ERC-20.
   * @template TOutput The output token, either Ether or an ERC-20.
   * @template TradeType The type of the trade, either exact in or exact out.
   * @param route route to swap through
   * @param amount the amount specified, either input or output, depending on tradeType
   * @param tradeType whether the trade is an exact input or exact output swap
   * @returns The route
   */
  public static async fromRoute(
    route: MixedRouteSDK,
    amount: TradeType extends TradeType.EXACT_INPUT ? CurrencyAmount : CurrencyAmount,
    tradeType: TradeType
  ): Promise<MixedRouteTrade> {
    const amounts: TokenAmount[] = new Array(route.path.length)
    let inputAmount: CurrencyAmount
    let outputAmount: CurrencyAmount
    const chainId=route.chainId

    invariant(tradeType === TradeType.EXACT_INPUT, 'TRADE_TYPE')

    invariant(wrappedCurrency(amount.currency,chainId).equals(wrappedCurrency(route.input,chainId)), 'INPUT')
    amounts[0] = wrappedAmount(amount,chainId)
    for (let i = 0; i < route.path.length - 1; i++) {
      const pool = route.pools[i]
      const [outputAmount] = await pool.getOutputAmount(amounts[i])
      amounts[i + 1] = outputAmount
    }
    inputAmount = new CurrencyAmount(route.input, amount.raw)
    outputAmount =new CurrencyAmount(
      route.output,
      amounts[amounts.length - 1].raw
    )

    return new MixedRouteTrade({
      routes: [{ inputAmount, outputAmount, route }],
      tradeType,
    })
  }

  /**
   * Constructs a trade from routes by simulating swaps
   *
   * @template TInput The input token, either Ether or an ERC-20.
   * @template TOutput The output token, either Ether or an ERC-20.
   * @template TradeType The type of the trade, either exact in or exact out.
   * @param routes the routes to swap through and how much of the amount should be routed through each
   * @param tradeType whether the trade is an exact input or exact output swap
   * @returns The trade
   */
  public static async fromRoutes(
    routes: {
      amount: TradeType extends TradeType.EXACT_INPUT ? CurrencyAmount : CurrencyAmount
      route: MixedRouteSDK
    }[],
    tradeType: TradeType
  ): Promise<MixedRouteTrade> {
    const populatedRoutes: {
      route: MixedRouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    invariant(tradeType === TradeType.EXACT_INPUT, 'TRADE_TYPE')

    for (const { route, amount } of routes) {
      const amounts: TokenAmount[] = new Array(route.path.length)
      let inputAmount: CurrencyAmount
      let outputAmount: CurrencyAmount
      const chainId=route.chainId

      invariant(wrappedCurrency(amount.currency,chainId).equals(wrappedCurrency(route.input,chainId)), 'INPUT')
      inputAmount = new CurrencyAmount(route.input, amount.raw)
      amounts[0] = new TokenAmount(wrappedCurrency(route.input,chainId), amount.raw)

      for (let i = 0; i < route.path.length - 1; i++) {
        const pool = route.pools[i]
        const [outputAmount] = await pool.getOutputAmount(amounts[i])
        amounts[i + 1] = outputAmount
      }

      outputAmount = new CurrencyAmount(
        route.output,
        amounts[amounts.length - 1].raw
      )

      populatedRoutes.push({ route, inputAmount, outputAmount })
    }

    return new MixedRouteTrade({
      routes: populatedRoutes,
      tradeType,
    })
  }

  /**
   * Creates a trade without computing the result of swapping through the route. Useful when you have simulated the trade
   * elsewhere and do not have any tick data
   * @template TInput The input token, either Ether or an ERC-20
   * @template TOutput The output token, either Ether or an ERC-20
   * @template TradeType The type of the trade, either exact in or exact out
   * @param constructorArguments The arguments passed to the trade constructor
   * @returns The unchecked trade
   */
  public static createUncheckedTrade(constructorArguments: {
    route: MixedRouteSDK
    inputAmount: CurrencyAmount
    outputAmount: CurrencyAmount
    tradeType: TradeType
  }): MixedRouteTrade {
    return new MixedRouteTrade({
      ...constructorArguments,
      routes: [
        {
          inputAmount: constructorArguments.inputAmount,
          outputAmount: constructorArguments.outputAmount,
          route: constructorArguments.route,
        },
      ],
    })
  }

  /**
   * Creates a trade without computing the result of swapping through the routes. Useful when you have simulated the trade
   * elsewhere and do not have any tick data
   * @template TInput The input token, either Ether or an ERC-20
   * @template TOutput The output token, either Ether or an ERC-20
   * @template TradeType The type of the trade, either exact in or exact out
   * @param constructorArguments The arguments passed to the trade constructor
   * @returns The unchecked trade
   */
  public static createUncheckedTradeWithMultipleRoutes(constructorArguments: {
    routes: {
      route: MixedRouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[]
    tradeType: TradeType
  }): MixedRouteTrade {
    return new MixedRouteTrade(constructorArguments)
  }

  /**
   * Construct a trade by passing in the pre-computed property values
   * @param routes The routes through which the trade occurs
   * @param tradeType The type of trade, exact input or exact output
   */
  private constructor({
    routes,
    tradeType,
  }: {
    routes: {
      route: MixedRouteSDK
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[]
    tradeType: TradeType
  }) {
    const inputCurrency = routes[0].inputAmount.currency
    const outputCurrency = routes[0].outputAmount.currency
    invariant(
      routes.every(({ route }) =>{
        const chainId=route.chainId
        return wrappedCurrency(inputCurrency,chainId).equals(wrappedCurrency(route.input,chainId))}),
      'INPUT_CURRENCY_MATCH'
    )
    invariant(
      routes.every(({ route }) =>{
        const chainId=route.chainId
        return wrappedCurrency(outputCurrency,chainId).equals(wrappedCurrency(route.output,chainId))}),
      'OUTPUT_CURRENCY_MATCH'
    )

    const numPools = routes.map(({ route }) => route.pools.length).reduce((total, cur) => total + cur, 0)
    const poolAddressSet = new Set<string>()
    for (const { route } of routes) {
      for (const pool of route.pools) {
        pool instanceof Pool
          ? poolAddressSet.add(Pool.getAddress(pool.token0, pool.token1))
          : poolAddressSet.add(Pair.getAddress(pool.token0, pool.token1))
      }
    }

    invariant(numPools == poolAddressSet.size, 'POOLS_DUPLICATED')

    invariant(tradeType === TradeType.EXACT_INPUT, 'TRADE_TYPE')

    this.swaps = routes
    this.tradeType = tradeType
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount out
   */
  public minimumAmountOut(slippageTolerance: Percent, amountOut = this.outputAmount): CurrencyAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    /// does not support exactOutput, as enforced in the constructor
    const slippageAdjustedAmountOut = new Fraction(ONE)
      .add(slippageTolerance)
      .invert()
      .multiply(amountOut.quotient).quotient
    return new CurrencyAmount(amountOut.currency, slippageAdjustedAmountOut)
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount in
   */
  public maximumAmountIn(slippageTolerance: Percent, amountIn = this.inputAmount): CurrencyAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    return amountIn
    /// does not support exactOutput
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
      this.maximumAmountIn(slippageTolerance).quotient,
      this.minimumAmountOut(slippageTolerance).quotient
    )
  }

  /**
   * Given a list of pools, and a fixed amount in, returns the top `maxNumResults` trades that go from an input token
   * amount to an output token, making at most `maxHops` hops.
   * Note this does not consider aggregation, as routes are linear. It's possible a better route exists by splitting
   * the amount in among multiple routes.
   * @param pools the pools to consider in finding the best trade
   * @param nextAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param maxNumResults maximum number of results to return
   * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pool
   * @param currentPools used in recursion; the current list of pools
   * @param currencyAmountIn used in recursion; the original value of the currencyAmountIn parameter
   * @param bestTrades used in recursion; the current list of best trades
   * @returns The exact in trade
   */
  public static async bestTradeExactIn(
    pools: (Pool | Pair)[],
    currencyAmountIn: CurrencyAmount,
    currencyOut: Currency,
    { maxNumResults = 3, maxHops = 3 }: BestTradeOptions = {},
    // used in recursion.
    currentPools: (Pool | Pair)[] = [],
    nextAmountIn: CurrencyAmount = currencyAmountIn,
    bestTrades: MixedRouteTrade[] = []
  ): Promise<MixedRouteTrade[]> {
    invariant(pools.length > 0, 'POOLS')
    invariant(maxHops > 0, 'MAX_HOPS')
    invariant(currencyAmountIn === nextAmountIn || currentPools.length > 0, 'INVALID_RECURSION')
    const chainId=pools[0].chainId
    const amountIn = wrappedAmount(nextAmountIn,chainId)
    const tokenOut = wrappedCurrency(currencyOut,chainId)
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i]
      // pool irrelevant
      if (!pool.token0.equals(amountIn.token) && !pool.token1.equals(amountIn.token)) continue
      if (pool instanceof Pair) {
        if ((pool as Pair).reserve0.equalTo(ZERO) || (pool as Pair).reserve1.equalTo(ZERO)) continue
      }

      let amountOut: TokenAmount
      try {
        ;[amountOut] = await pool.getOutputAmount(amountIn)
      } catch (error) {
        // input too low
        // @ts-ignore[2571] error is unknown
        if (error.isInsufficientInputAmountError) {
          continue
        }
        throw error
      }
      // we have arrived at the output token, so this is the final trade of one of the paths
      if (amountOut.token && amountOut.token.equals(tokenOut)) {
        sortedInsert(
          bestTrades,
          await MixedRouteTrade.fromRoute(
            new MixedRouteSDK([...currentPools, pool], currencyAmountIn.currency, currencyOut),
            currencyAmountIn,
            TradeType.EXACT_INPUT
          ),
          maxNumResults,
          mixedTradeComparator
        )
      } else if (maxHops > 1 && pools.length > 1) {
        const poolsExcludingThisPool = pools.slice(0, i).concat(pools.slice(i + 1, pools.length))

        // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
        await MixedRouteTrade.bestTradeExactIn(
          poolsExcludingThisPool,
          currencyAmountIn,
          currencyOut,
          {
            maxNumResults,
            maxHops: maxHops - 1,
          },
          [...currentPools, pool],
          amountOut,
          bestTrades
        )
      }
    }

    return bestTrades
  }
}