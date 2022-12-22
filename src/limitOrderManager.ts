import { Interface } from "@ethersproject/abi";
import { Order } from "entities/order";
import { MethodParameters, Percent,Currency, Pool, toHex, wrappedCurrency } from "./index";
import invariant from "tiny-invariant";
import LimitOrderManagerAbi from "./abis/LimitOrderManager.json"
import JSBI from 'jsbi'
import { BigintIsh, ZERO } from "./constants";

  /**
   * Options for producing the calldata to create limit order.
   */
export interface CreateOrderOptions{
    /**
     * How much the pool price is allowed to move.
     */
     slippageTolerance: Percent
  
     /**
      * When the transaction expires, in epoch seconds.
      */
     deadline: BigintIsh
   
     /**
      * Whether to spend ether. If true, one of the pool tokens must be WETH, by default false
      */
     useNative?: Currency

     /**
     * The lower and upper old
     */
     lowerOldTick: number

     /**
     * The lower and upper old
     */
     upperOldTick: number
 
}

export interface ClaimOrderOptions{
    /**
     * Indicates the ID of the position to collect for.
     */
    tokenId: BigintIsh

     /**
      * When the transaction expires, in epoch seconds.
      */
     deadline: BigintIsh

     unwrapVault: Boolean

}
export interface CancelOrderOptions{
    /**
     * Indicates the ID of the position to collect for.
     */
    tokenId: BigintIsh

     /**
      * When the transaction expires, in epoch seconds.
      */
     deadline: BigintIsh

     unwrapVault: Boolean

}



export abstract class LimitOrderManager {
    public static INTERFACE: Interface = new Interface(LimitOrderManagerAbi);

    /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static createCallParameters(order:Order, options:CreateOrderOptions):MethodParameters {
    invariant(JSBI.greaterThan(order.amountIn, ZERO), 'ZERO_AMOUNT_IN')

    let calldata: string

    // get amounts
    const {zeroForOne,amountIn,tick}=order;
    const {lowerOldTick,upperOldTick}=options

    calldata=this.INTERFACE.encodeFunctionData('createLimitOrder',[
        Pool.getAddress(order.pool.token0,order.pool.token1),
        tick,
        lowerOldTick,
        upperOldTick,
        true,
        amountIn.toString(),
        zeroForOne
    ])

    let value: string = toHex(0)
    if (options.useNative) {
      const wrapped = wrappedCurrency(options.useNative,order.tokenAmountIn.token.chainId)
      invariant(order.tokenAmountIn.token.equals(wrapped), 'NO_WETH')

      const wrappedValue = order.amountIn

      value = toHex(wrappedValue)
    }

    return {
        calldata,
        value
      }

  }

  public static claimCallParameters(options:ClaimOrderOptions):MethodParameters {
    let calldata

    const tokenId = toHex(options.tokenId)
    const unwrapVault=options.unwrapVault
    // const involvesETH =
    //   false

    calldata=this.INTERFACE.encodeFunctionData('claimLimitOrder',[
        tokenId,
        unwrapVault
    ])

    const  value = toHex(0)

    return {
        calldata,
        value
      }


  }
  public static cancelallParameters(options:CancelOrderOptions):MethodParameters {
    let calldata

    const tokenId = toHex(options.tokenId)
    const unwrapVault=options.unwrapVault
    // const involvesETH =
    //   false

    calldata=this.INTERFACE.encodeFunctionData('cancelLimitOrder',[
        tokenId,
        unwrapVault
    ])

    const  value = toHex(0)

    return {
        calldata,
        value
      }

  }

}