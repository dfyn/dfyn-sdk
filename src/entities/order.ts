import JSBI from "jsbi"
import { Pool } from "./pool"
import invariant from "tiny-invariant"
import { BigintIsh, FullMath, Price, TickMath, tickToPrice, TokenAmount, TradeType } from '../index';
import { Q96 } from "../internalConstants"

interface OrderConstructorArgs {
    pool: Pool
    tick: number
    amount: BigintIsh
    zeroForOne: boolean
    tradeType: TradeType
}

enum ORDER_TYPE {
    BUY_ORDER,
    SELL_ORDER
}
/**
 * Represents a limit order on a Dfyn V2 Pool
 */
 export class Order {
    public readonly pool: Pool
    public readonly tick: number
    public readonly amount: JSBI
    public readonly zeroForOne: boolean
    /**
     * The type of the trade, either exact in or exact out.
    */
    public readonly tradeType: TradeType

    // cached resuts for the getters
    private _tokenAmountIn: TokenAmount | null = null
    private _tokenAmountOut: TokenAmount | null = null

      /**
   * Constructs a position for a given pool with the given liquidity
   * @param pool For which pool the liquidity is assigned
   * @param tick The tick where limit order sits
   * @param amountIn The amount of liquidity that is in the position
   * @param tickUpper The upper tick of the position
   */
    public constructor({ pool, tick, amount, zeroForOne, tradeType }:OrderConstructorArgs){
        invariant(tick >= TickMath.MIN_TICK && tick % pool.tickSpacing === 0, 'INVALID_TICK')
        invariant(tick <= TickMath.MAX_TICK && tick % pool.tickSpacing === 0, 'INVALID_TICK')
        // const sqrtpriceX96=TickMath.getSqrtRatioAtTick(tick)
        // if (zeroForOne) {
        //     invariant(
        //         JSBI.greaterThan(sqrtpriceX96,pool.sqrtRatioX96)
        //          , "INVALID_SELL_ORDER");
        // } else {
        //     invariant(JSBI.lessThan(sqrtpriceX96,pool.sqrtRatioX96), "INVALID_BUY_ORDER");
        // }
        this.pool = pool
        this.tick = tick
        this.zeroForOne = zeroForOne
        this.amount = JSBI.BigInt(amount)
        this.tradeType = tradeType
    }

  /**
   * Returns the price of where limit order sits
   */
  public get atPrice(): Price {
    return tickToPrice(this.pool.token0, this.pool.token1, this.tick)
  }

  /**
   * Returns the type of limit order
   */
  public get type(): ORDER_TYPE {
        if (this.zeroForOne) {
            return ORDER_TYPE.BUY_ORDER
        } else {
            return ORDER_TYPE.SELL_ORDER
        }  
   }

   /**
   * Returns the amountIn of limit order
   */
  public get tokenAmountIn(): TokenAmount {
    if (this._tokenAmountIn === null) {
      if (this.tradeType === exports.TradeType.EXACT_INPUT) {
        if (!this.zeroForOne) {
          this._tokenAmountIn = new TokenAmount(this.pool.token1, this.amount.toString());
        } else {
          this._tokenAmountIn = new TokenAmount(this.pool.token0, this.amount.toString());
        }
      } else {
        if (!this.zeroForOne) {
          // 1 -> 0 
          var amountIn = FullMath.mulDivRoundingUp(this.amount, this.sqrtpriceX96, Q96);
          amountIn = FullMath.mulDivRoundingUp(amountIn, this.sqrtpriceX96, Q96);
          this._tokenAmountIn = new TokenAmount(this.pool.token1, amountIn.toString());
        } else {
          // 0 -> 1
          var _amountIn = FullMath.mulDivRoundingUp(this.amount, Q96, this.sqrtpriceX96);

          _amountIn = FullMath.mulDivRoundingUp(_amountIn, Q96, this.sqrtpriceX96);
          this._tokenAmountIn = new TokenAmount(this.pool.token0, _amountIn.toString());
        }
      }
    }
    return this._tokenAmountIn
  }

   /**
   * Returns the expected amountOut of limit order
   */
   public get tokenAmountOut(): TokenAmount {
    if (this._tokenAmountOut === null) {
      if (this.tradeType === exports.TradeType.EXACT_OUTPUT) {
        if (this.zeroForOne) {
          this._tokenAmountOut = new TokenAmount(this.pool.token1, this.amount.toString());
        } else {
          this._tokenAmountOut = new TokenAmount(this.pool.token0, this.amount.toString());
        }
      } else {
        if (this.zeroForOne) {
          // 0->1
          var amountOut = FullMath.mulDivRoundingUp(this.amount, this.sqrtpriceX96, Q96);
          amountOut = FullMath.mulDivRoundingUp(amountOut, this.sqrtpriceX96, Q96);
          this._tokenAmountOut = new TokenAmount(this.pool.token1, amountOut.toString());
        } else {
          // 1->0
          var _amountOut = FullMath.mulDivRoundingUp(this.amount, Q96, this.sqrtpriceX96);

          _amountOut = FullMath.mulDivRoundingUp(_amountOut, Q96, this.sqrtpriceX96);
          this._tokenAmountOut = new TokenAmount(this.pool.token0, _amountOut.toString());
        }
      }
    }

    return this._tokenAmountOut;
  }

  /**
   * Returns the sqrtpriceX96
   */
  public get sqrtpriceX96():JSBI{
    return TickMath.getSqrtRatioAtTick(this.tick)
  }

}