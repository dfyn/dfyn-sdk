import JSBI from "jsbi"
import { Pool } from "./pool"
import invariant from "tiny-invariant"
import { BigintIsh, Price, TokenAmount,FullMath, TickMath, tickToPrice } from '../index'
import { Q96 } from "../internalConstants"

interface OrderConstructorArgs {
    pool: Pool
    tick: number
    amountIn: BigintIsh
    zeroForOne: boolean
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
    public readonly amountIn: JSBI
    public readonly zeroForOne: boolean

    // cached resuts for the getters
    private _tokenAmountIn: TokenAmount | null = null
    private _expectedTokenAmountOut: TokenAmount | null = null

      /**
   * Constructs a position for a given pool with the given liquidity
   * @param pool For which pool the liquidity is assigned
   * @param tick The tick where limit order sits
   * @param amountIn The amount of liquidity that is in the position
   * @param tickUpper The upper tick of the position
   */
    public constructor({ pool, tick, amountIn, zeroForOne }:OrderConstructorArgs){
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
        this.amountIn = JSBI.BigInt(amountIn)
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
      if (this.zeroForOne) {
        this._tokenAmountIn = new TokenAmount(
          this.pool.token1,
          this.amountIn.toString()
        )
      } else {
        this._tokenAmountIn = new TokenAmount(
            this.pool.token0, 
            this.amountIn.toString()
        )
      }
    }
    return this._tokenAmountIn
  }

   /**
   * Returns the expected amountOut of limit order
   */
  public get expectedTokenAmountOut(): TokenAmount {
    if (this._expectedTokenAmountOut === null) {
      if (this.zeroForOne) {
        let amountOut = FullMath.mulDivRoundingUp(this.amountIn, this.sqrtpriceX96, Q96);
        amountOut = FullMath.mulDivRoundingUp(amountOut, this.sqrtpriceX96, Q96);        
        this._expectedTokenAmountOut = new TokenAmount(
          this.pool.token0,
          amountOut.toString()
        )
      } else {
        let amountOut = FullMath.mulDivRoundingUp(this.amountIn, Q96,
            this.sqrtpriceX96);
        amountOut = FullMath.mulDivRoundingUp(amountOut, Q96,
            this.sqrtpriceX96);
        this._expectedTokenAmountOut = new TokenAmount(
            this.pool.token1, 
            amountOut.toString()
        )
      }
    }
    return this._expectedTokenAmountOut
  }

  /**
   * Returns the sqrtpriceX96
   */
  public get sqrtpriceX96():JSBI{
    return TickMath.getSqrtRatioAtTick(this.tick)
  }

}