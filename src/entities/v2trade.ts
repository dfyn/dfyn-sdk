import { ChainId, Fraction, Percent, Price, CurrencyAmount, TokenAmount,TradeType, wrappedCurrency, wrappedAmount } from '../index'
import invariant from 'tiny-invariant'
import { ONE, ZERO } from '../internalConstants'
import { Pool } from './pool'
import { V2Route } from './v2route'


export function v2TradeComparator(
  a: V2Trade,
  b: V2Trade,
  chainId: ChainId
) {
  // must have same input and output token for comparison
  invariant(wrappedCurrency(a.inputAmount.currency,chainId).equals(wrappedCurrency(b.inputAmount.currency,chainId)), 'INPUT_CURRENCY')
  invariant(wrappedCurrency(a.outputAmount.currency,chainId).equals(wrappedCurrency(b.outputAmount.currency,chainId)), 'OUTPUT_CURRENCY')
  if (a.outputAmount.equalTo(b.outputAmount)) {
    if (a.inputAmount.equalTo(b.inputAmount)) {
      // consider the number of hops since each hop costs gas
      const aHops = a.swaps.reduce((total, cur) => total + cur.route.tokenPath.length, 0)
      const bHops = b.swaps.reduce((total, cur) => total + cur.route.tokenPath.length, 0)
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

export interface BestV2TradeOptions {
  // how many results to return
  maxNumResults?: number
  // the maximum number of hops a trade should contain
  maxHops?: number
}


export class V2Trade {
  /**
   * @deprecated Deprecated in favor of 'swaps' property. If the trade consists of multiple routes
   * this will return an error.
   *
   * When the trade consists of just a single route, this returns the route of the trade,
   * i.e. which pools the trade goes through.
   */
  public get route(): V2Route {
    invariant(this.swaps.length == 1, 'MULTIPLE_ROUTES')
    return this.swaps[0].route
  }

  /**
   * The swaps of the trade, i.e. which routes and how much is swapped in each that
   * make up the trade.
   */
  public readonly swaps: {
    route: V2Route
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
   * Constructs an exact in trade with the given amount in and route
   * @template TInput The input token, either Ether or an ERC-20
   * @template TOutput The output token, either Ether or an ERC-20
   * @param route The route of the exact in trade
   * @param amountIn The amount being passed in
   * @returns The exact in trade
   */
  public static async exactIn(
    route: V2Route,
    amountIn: CurrencyAmount
  ): Promise<V2Trade> {
    return V2Trade.fromRoute(route, amountIn, TradeType.EXACT_INPUT)
  }

  /**
   * Constructs an exact out trade with the given amount out and route
   * @template TInput The input token, either Ether or an ERC-20
   * @template TOutput The output token, either Ether or an ERC-20
   * @param route The route of the exact out trade
   * @param amountOut The amount returned by the trade
   * @returns The exact out trade
   */
  public static async exactOut(
    route: V2Route,
    amountOut: CurrencyAmount
  ): Promise<V2Trade> {
    return V2Trade.fromRoute(route, amountOut, TradeType.EXACT_OUTPUT)
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
    route: V2Route,
    amount: TradeType extends TradeType.EXACT_INPUT ? CurrencyAmount: CurrencyAmount,
    tradeType: TradeType
  ): Promise<V2Trade> {
    const amounts: CurrencyAmount[] = new Array(route.tokenPath.length)
    let inputAmount: CurrencyAmount
    let outputAmount: CurrencyAmount
    const chainId=route.chainId;
    if (tradeType === TradeType.EXACT_INPUT) {
      invariant(wrappedCurrency(amount.currency,chainId).equals(wrappedCurrency(route.input,chainId)), 'INPUT')
      amounts[0] = wrappedAmount(amount,chainId)
      for (let i = 0; i < route.tokenPath.length - 1; i++) {
        const pool = route.pools[i]
        const [outputAmount] = await pool.getOutputAmount(wrappedAmount(amounts[i],chainId))
        amounts[i + 1] = outputAmount
      }
      inputAmount = new CurrencyAmount(route.input, amount.raw)
      outputAmount = new CurrencyAmount(
        route.output,
        amounts[amounts.length - 1].raw
      )
    } else {
      invariant(wrappedCurrency(amount.currency,chainId).equals(wrappedCurrency(route.output,chainId)), 'OUTPUT')
      amounts[amounts.length - 1] = wrappedAmount(amount,chainId)
      for (let i = route.tokenPath.length - 1; i > 0; i--) {
        const pool = route.pools[i - 1]
        const [inputAmount] = await pool.getInputAmount(wrappedAmount(amounts[i],chainId))
        amounts[i - 1] = inputAmount
      }
      inputAmount = new CurrencyAmount(route.input, amount.raw)
      outputAmount = new CurrencyAmount(route.output, amount.raw)
    }

    return new V2Trade({
      routes: [{ inputAmount, outputAmount, route }],
      tradeType
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
      route: V2Route
    }[],
    tradeType: TradeType
  ): Promise<V2Trade> {
    const populatedRoutes: {
      route: V2Route
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[] = []

    for (const { route, amount } of routes) {
      const amounts: CurrencyAmount[] = new Array(route.tokenPath.length)
      let inputAmount: CurrencyAmount
      let outputAmount: CurrencyAmount
      const chainId=route.chainId;
      if (tradeType === TradeType.EXACT_INPUT) {
        invariant(wrappedCurrency(amount.currency,chainId).equals(wrappedCurrency(route.input,chainId)), 'INPUT')
        inputAmount = new CurrencyAmount(route.input, amount.raw)
        amounts[0] = new TokenAmount(wrappedCurrency(route.input,chainId), amount.raw)

        for (let i = 0; i < route.tokenPath.length - 1; i++) {
          const pool = route.pools[i]
          const [outputAmount] = await pool.getOutputAmount(wrappedAmount(amounts[i],chainId))
          amounts[i + 1] = outputAmount
        }

        outputAmount = new CurrencyAmount(
          route.output,
          amounts[amounts.length - 1].raw
        )
      } else {
        invariant(wrappedCurrency(amount.currency,chainId).equals(wrappedCurrency(route.output,chainId)), 'OUTPUT')
        outputAmount = new CurrencyAmount(route.output, amount.raw)
        amounts[amounts.length - 1] =new CurrencyAmount(
          wrappedCurrency(route.output,chainId),
          amount.raw
        )

        for (let i = route.tokenPath.length - 1; i > 0; i--) {
          const pool = route.pools[i - 1]
          const [inputAmount] = await pool.getInputAmount(wrappedAmount(amounts[i],chainId))
          amounts[i - 1] = inputAmount
        }

        inputAmount =new CurrencyAmount(route.input, amounts[0].raw)
      }

      populatedRoutes.push({ route, inputAmount, outputAmount })
    }

    return new V2Trade({
      routes: populatedRoutes,
      tradeType
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
    route: V2Route
    inputAmount: CurrencyAmount
    outputAmount: CurrencyAmount
    tradeType: TradeType
  }): V2Trade {
    return new V2Trade({
      ...constructorArguments,
      routes: [
        {
          inputAmount: constructorArguments.inputAmount,
          outputAmount: constructorArguments.outputAmount,
          route: constructorArguments.route
        }
      ]
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
      route: V2Route
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[]
    tradeType: TradeType
  }): V2Trade {
    return new V2Trade(constructorArguments)
  }

  /**
   * Construct a trade by passing in the pre-computed property values
   * @param routes The routes through which the trade occurs
   * @param tradeType The type of trade, exact input or exact output
   */
  private constructor({
    routes,
    tradeType
  }: {
    routes: {
      route: V2Route
      inputAmount: CurrencyAmount
      outputAmount: CurrencyAmount
    }[]
    tradeType: TradeType
  }) {
    const chainId=routes[0].route.chainId
    const inputCurrency = routes[0].inputAmount.currency
    const outputCurrency = routes[0].outputAmount.currency
    invariant(
      routes.every(({ route }) => wrappedCurrency(inputCurrency,chainId).equals(wrappedCurrency(route.input,chainId))),
      'INPUT_CURRENCY_MATCH'
    )
    invariant(
      routes.every(({ route }) => wrappedCurrency(outputCurrency,chainId).equals(wrappedCurrency(route.output,chainId))),
      'OUTPUT_CURRENCY_MATCH'
    )

    const numPools = routes.map(({ route }) => route.pools.length).reduce((total, cur) => total + cur, 0)
    const poolAddressSet = new Set<string>()
    for (const { route } of routes) {
      for (const pool of route.pools) {
        poolAddressSet.add(Pool.getAddress(pool.token0, pool.token1))
      }
    }

    invariant(numPools == poolAddressSet.size, 'POOLS_DUPLICATED')

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
//   public static async bestTradeExactIn(
//     pools: Pool[],
//     currencyAmountIn: CurrencyAmount,
//     currencyOut: Currency,
//     { maxNumResults = 3, maxHops = 3 }: BestTradeOptions = {},
//     // used in recursion.
//     currentPools: Pool[] = [],
//     nextAmountIn: CurrencyAmount = currencyAmountIn,
//     bestTrades: Trade[] = []
//   ): Promise<Trade[]> {
//     invariant(pools.length > 0, 'POOLS')
//     invariant(maxHops > 0, 'MAX_HOPS')
//     invariant(currencyAmountIn === nextAmountIn || currentPools.length > 0, 'INVALID_RECURSION')

//     const amountIn = nextAmountIn.wrapped
//     const tokenOut = currencyOut.wrapped
//     for (let i = 0; i < pools.length; i++) {
//       const pool = pools[i]
//       // pool irrelevant
//       if (!pool.token0.equals(amountIn.currency) && !pool.token1.equals(amountIn.currency)) continue

//       let amountOut: CurrencyAmount
//       try {
//         ;[amountOut] = await pool.getOutputAmount(amountIn)
//       } catch (error) {
//         // input too low
//         if (error.isInsufficientInputAmountError) {
//           continue
//         }
//         throw error
//       }
//       // we have arrived at the output token, so this is the final trade of one of the paths
//       if (amountOut.currency.isToken && amountOut.currency.equals(tokenOut)) {
//         sortedInsert(
//           bestTrades,
//           await Trade.fromRoute(
//             new Route([...currentPools, pool], currencyAmountIn.currency, currencyOut),
//             currencyAmountIn,
//             TradeType.EXACT_INPUT
//           ),
//           maxNumResults,
//           tradeComparator
//         )
//       } else if (maxHops > 1 && pools.length > 1) {
//         const poolsExcludingThisPool = pools.slice(0, i).concat(pools.slice(i + 1, pools.length))

//         // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
//         await Trade.bestTradeExactIn(
//           poolsExcludingThisPool,
//           currencyAmountIn,
//           currencyOut,
//           {
//             maxNumResults,
//             maxHops: maxHops - 1
//           },
//           [...currentPools, pool],
//           amountOut,
//           bestTrades
//         )
//       }
//     }

//     return bestTrades
//   }

  /**
   * similar to the above method but instead targets a fixed output amount
   * given a list of pools, and a fixed amount out, returns the top `maxNumResults` trades that go from an input token
   * to an output token amount, making at most `maxHops` hops
   * note this does not consider aggregation, as routes are linear. it's possible a better route exists by splitting
   * the amount in among multiple routes.
   * @param pools the pools to consider in finding the best trade
   * @param currencyIn the currency to spend
   * @param currencyAmountOut the desired currency amount out
   * @param nextAmountOut the exact amount of currency out
   * @param maxNumResults maximum number of results to return
   * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pool
   * @param currentPools used in recursion; the current list of pools
   * @param bestTrades used in recursion; the current list of best trades
   * @returns The exact out trade
   */
//   public static async bestTradeExactOut<TInput extends Currency, TOutput extends Currency>(
//     pools: Pool[],
//     currencyIn: TInput,
//     currencyAmountOut: CurrencyAmount,
//     { maxNumResults = 3, maxHops = 3 }: BestTradeOptions = {},
//     // used in recursion.
//     currentPools: Pool[] = [],
//     nextAmountOut: CurrencyAmount<Currency> = currencyAmountOut,
//     bestTrades: Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[] = []
//   ): Promise<Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[]> {
//     invariant(pools.length > 0, 'POOLS')
//     invariant(maxHops > 0, 'MAX_HOPS')
//     invariant(currencyAmountOut === nextAmountOut || currentPools.length > 0, 'INVALID_RECURSION')

//     const amountOut = nextAmountOut.wrapped
//     const tokenIn = currencyIn.wrapped
//     for (let i = 0; i < pools.length; i++) {
//       const pool = pools[i]
//       // pool irrelevant
//       if (!pool.token0.equals(amountOut.currency) && !pool.token1.equals(amountOut.currency)) continue

//       let amountIn: CurrencyAmount
//       try {
//         ;[amountIn] = await pool.getInputAmount(amountOut)
//       } catch (error) {
//         // not enough liquidity in this pool
//         if (error.isInsufficientReservesError) {
//           continue
//         }
//         throw error
//       }
//       // we have arrived at the input token, so this is the first trade of one of the paths
//       if (amountIn.currency.equals(tokenIn)) {
//         sortedInsert(
//           bestTrades,
//           await Trade.fromRoute(
//             new Route([pool, ...currentPools], currencyIn, currencyAmountOut.currency),
//             currencyAmountOut,
//             TradeType.EXACT_OUTPUT
//           ),
//           maxNumResults,
//           tradeComparator
//         )
//       } else if (maxHops > 1 && pools.length > 1) {
//         const poolsExcludingThisPool = pools.slice(0, i).concat(pools.slice(i + 1, pools.length))

//         // otherwise, consider all the other paths that arrive at this token as long as we have not exceeded maxHops
//         await Trade.bestTradeExactOut(
//           poolsExcludingThisPool,
//           currencyIn,
//           currencyAmountOut,
//           {
//             maxNumResults,
//             maxHops: maxHops - 1
//           },
//           [pool, ...currentPools],
//           amountIn,
//           bestTrades
//         )
//       }
//     }

//     return bestTrades
//   }
}
