import { Interface } from "@ethersproject/abi";
import { Order } from "entities/order";
import { MethodParameters, Percent, Currency, Pool, toHex, wrappedCurrency } from "./index";
import invariant from "tiny-invariant";
import LimitOrderManagerAbi from "./abis/LimitOrderManager.json"
import JSBI from 'jsbi'
import { BigintIsh, ZERO } from "./constants";
import { Multicall } from "./multicall";

/**
 * Options for producing the calldata to create limit order.
 */
export interface CreateOrderOptions {
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

  /**
  * The lower and upper old
  */
  recipient: string

}

export interface ClaimOrderOptions {
  /**
   * Indicates the ID of the position to collect for.
   */
  tokenId: BigintIsh | BigintIsh[]

  /**
   * When the transaction expires, in epoch seconds.
   */
  deadline: BigintIsh

  unwrapVault: Boolean

}
export interface CancelOrderOptions {
  /**
   * Indicates the ID of the position to collect for.
   */
  tokenId: BigintIsh | BigintIsh[]

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
  private constructor() { }

  public static createCallParameters(order: Order, options: CreateOrderOptions): MethodParameters {
    invariant(JSBI.greaterThan(order.tokenAmountIn.raw, ZERO), 'ZERO_AMOUNT_IN')

    let calldata: string

    // get amounts
    const { zeroForOne, tokenAmountIn, tick } = order;
    const { lowerOldTick, upperOldTick } = options;
    const amountIn = tokenAmountIn.raw;
    const recipient = options.recipient;

    calldata = this.INTERFACE.encodeFunctionData('createLimitOrder', [
      Pool.getAddress(order.pool.token0, order.pool.token1),
      tick,
      lowerOldTick,
      upperOldTick,
      true,
      amountIn.toString(),
      zeroForOne,
      recipient
    ])

    let value: string = toHex(0)
    if (options.useNative) {
      const wrapped = wrappedCurrency(options.useNative, order.tokenAmountIn.token.chainId)
      invariant(order.tokenAmountIn.token.equals(wrapped), 'NO_WETH')

      const wrappedValue = amountIn.toString()

      value = toHex(wrappedValue)
    }

    return {
      calldata,
      value
    }

  }

  public static claimCallParameters(options: ClaimOrderOptions): MethodParameters {
    const calldatas: string[] = []

    const unwrapVault = options.unwrapVault
    const tokenIdOrIds = options.tokenId
    if (Array.isArray(tokenIdOrIds)) {
      // If the tokenIdOrIds is an array of ids, iterate through each ids
      tokenIdOrIds.forEach((tokenIdinBigInt) => {
        // Handle each id here
        const tokenId = toHex(tokenIdinBigInt)
        calldatas.push(this.INTERFACE.encodeFunctionData('claimLimitOrder', [
          tokenId,
          unwrapVault
        ]))
      });
    } else {
      // If the tokenIdOrIds is a single tokenId, handle it directly
      const tokenId = toHex(tokenIdOrIds)
      calldatas.push(this.INTERFACE.encodeFunctionData('claimLimitOrder', [
        tokenId,
        unwrapVault
      ]))
    }


    const value = toHex(0)

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value
    }

  }

  public static cancelCallParameters(options: CancelOrderOptions): MethodParameters {
    let calldatas: string[] = []

    const unwrapVault = options.unwrapVault
    const tokenIdOrIds = options.tokenId

    if (Array.isArray(tokenIdOrIds)) {
      // If the tokenIdOrIds is an array of ids, iterate through each ids
      tokenIdOrIds.forEach((tokenIdinBigInt) => {
        // Handle each id here
        const tokenId = toHex(tokenIdinBigInt)
        calldatas.push(this.INTERFACE.encodeFunctionData('cancelLimitOrder', [
          tokenId,
          unwrapVault
        ]))
      });
    } else {
      // If the tokenIdOrIds is a single tokenId, handle it directly
      const tokenId = toHex(tokenIdOrIds)
      calldatas.push(this.INTERFACE.encodeFunctionData('cancelLimitOrder', [
        tokenId,
        unwrapVault
      ]))
    }

    const value = toHex(0)

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value
    }
  }


}