import { Interface } from "@ethersproject/abi";
import invariant from "tiny-invariant";
import ConcentratedPoolManagerAbi from "./abis/ConcentratedPoolManager.json"
import { Currency, CurrencyAmount, Percent, Pool, Position, wrappedCurrency } from "./entities";
import { ZERO } from "./internalConstants";
import { MethodParameters, toHex, validateAndParseAddress } from "./utils";
import JSBI from 'jsbi'
import { ADDRESS_ZERO, BigintIsh } from "./constants";

export interface MintSpecificOptions {
    /**
     * The account that should receive the minted NFT.
     */
    recipient: string
  
    /**
     * Creates pool if not initialized before mint.
     */
    createPool?: boolean
  }
  export interface CollectOptions {
    /**
     * Indicates the ID of the position to collect for.
     */
    tokenId: BigintIsh
  
    /**
     * Expected value of tokensOwed0, including as-of-yet-unaccounted-for fees/liquidity value to be burned
     */
    expectedCurrencyOwed0: CurrencyAmount
  
    /**
     * Expected value of tokensOwed1, including as-of-yet-unaccounted-for fees/liquidity value to be burned
     */
    expectedCurrencyOwed1: CurrencyAmount
  
    /**
     * The account that should receive the tokens.
     */
    recipient: string

    /**
     * To unwrap or not
     */
    unwrapVault: boolean
  }
/**
 * Options for producing the calldata to exit a position.
 */
 export interface RemoveLiquidityOptions {
  /**
   * The ID of the token to exit
   */
  tokenId: BigintIsh

  /**
   * The percentage of position liquidity to exit.
   */
  liquidityPercentage: Percent

  /**
   * How much the pool price is allowed to move.
   */
  slippageTolerance: Percent


  /**
     * The account that should receive the tokens.
     */
   recipient: string

      /**
     * To unwrap or not
     */
       unwrapVault: boolean
}
  
  export interface IncreaseSpecificOptions {
    /**
     * Indicates the ID of the position to increase liquidity for.
     */
    tokenId: BigintIsh
  }
  
  /**
   * Options for producing the calldata to add liquidity.
   */
  export interface CommonAddLiquidityOptions {
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
  
    // /**
    //  * The optional permit parameters for spending token0
    //  */
    // token0Permit?: PermitOptions
  
    // /**
    //  * The optional permit parameters for spending token1
    //  */
    // token1Permit?: PermitOptions
  
    /**
     * The lower and upper old
     */
    lowerOldTick: number
  
    /**
     * The lower and upper old
     */
    upperOldTick: number
    
  }
  
  export type MintOptions = CommonAddLiquidityOptions & MintSpecificOptions
  export type IncreaseOptions = CommonAddLiquidityOptions & IncreaseSpecificOptions
  
  export type AddLiquidityOptions = MintOptions | IncreaseOptions
  
  export interface SafeTransferOptions {
    /**
     * The account sending the NFT.
     */
    sender: string
  
    /**
     * The account that should receive the NFT.
     */
    recipient: string
  
    /**
     * The id of the token being sent.
     */
    tokenId: BigintIsh
    /**
     * The optional parameter that passes data to the `onERC721Received` call for the staker
     */
    data?: string
  }

  // type guard
export function isMint(options: AddLiquidityOptions): options is MintOptions {
    return Object.keys(options).some(k => k === 'recipient')
  }


export abstract class ConcentratedPoolManager {
    public static INTERFACE: Interface = new Interface(ConcentratedPoolManagerAbi)

   /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static addCallParameters(position: Position, options: AddLiquidityOptions): MethodParameters {
    invariant(JSBI.greaterThan(position.liquidity, ZERO), 'ZERO_LIQUIDITY')

    let calldata: string

    // get amounts
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

        // adjust for slippage
        // const minimumAmounts = position.mintAmountsWithSlippage(options.slippageTolerance)
        // const amount0Min = toHex(minimumAmounts.amount0)
        // const amount1Min = toHex(minimumAmounts.amount1)
    
        // const deadline = toHex(options.deadline)

        // revert if pool not present
        // invariant(options?.createPool,'POOL_DOES_NOT_EXISTS');

            // permits if necessary
    // if (options.token0Permit) {
    //     calldatas.push(SelfPermit.encodePermit(position.pool.token0, options.token0Permit))
    //   }
    //   if (options.token1Permit) {
    //     calldatas.push(SelfPermit.encodePermit(position.pool.token1, options.token1Permit))
    //   }

       // mint  
    if (isMint(options)) {  
        calldata=
          this.INTERFACE.encodeFunctionData('mint', [
              Pool.getAddress(position.pool.token0,position.pool.token1),
              options.lowerOldTick,
              position.tickLower,
              options.upperOldTick,
              position.tickUpper,
              toHex(amount0Desired),
              toHex(amount1Desired),
              true,
              position.liquidity.toString(),
              "0"    
            //   token0: position.pool.token0.address,
            //   token1: position.pool.token1.address,
            //   fee: position.pool.fee,
            //   tickLower: position.tickLower,
            //   tickUpper: position.tickUpper,
            //   amount0Desired: toHex(amount0Desired),
            //   amount1Desired: toHex(amount1Desired),
            //   amount0Min,
            //   amount1Min,
            //   recipient,
            //   deadline
          ])
        
      } else {
        // increase
        calldata=
            this.INTERFACE.encodeFunctionData('mint', [
                Pool.getAddress(position.pool.token0,position.pool.token1),
                options.lowerOldTick,
                position.tickLower,
                options.upperOldTick,
                position.tickUpper,
                toHex(amount0Desired),
                toHex(amount1Desired),
                true,
                position.liquidity.toString(),
                options.tokenId
              //   token0: position.pool.token0.address,
              //   token1: position.pool.token1.address,
              //   fee: position.pool.fee,
              //   tickLower: position.tickLower,
              //   tickUpper: position.tickUpper,
              //   amount0Desired: toHex(amount0Desired),
              //   amount1Desired: toHex(amount1Desired),
              //   amount0Min,
              //   amount1Min,
              //   recipient,
              //   deadline
            ])
      }
  
      let value: string = toHex(0)
      if (options.useNative) {
        const wrapped = wrappedCurrency(options.useNative,position.pool.token0.chainId)
        invariant(position.pool.token0.equals(wrapped) || position.pool.token1.equals(wrapped), 'NO_WETH')

        const wrappedValue = position.pool.token0.equals(wrapped) ? amount0Desired : amount1Desired

        value = toHex(wrappedValue)
      }
      
      return {
        calldata,
        value
      }
  }

  private static encodeCollect(options: CollectOptions): string {
    let calldata

    const tokenId = toHex(options.tokenId)

    // // // // // // // // // // // // // // // // // // // // //
    // // // // // // // NATIVE SUPPORT TO BE ADDED // // // // //
    // // // // // // // // // // // // // // // // // // // // //
    // const involvesETH =
    //   options.expectedCurrencyOwed0.currency.isNative || options.expectedCurrencyOwed1.currency.isNative
    const involvesETH =
      false

    const recipient = validateAndParseAddress(options.recipient)

    // collect
    calldata=
      this.INTERFACE.encodeFunctionData('collect', [
          tokenId,
          involvesETH ? ADDRESS_ZERO : recipient,
          options.unwrapVault
      ])

    // if (involvesETH) {
    //   const ethAmount = options.expectedCurrencyOwed0.currency.isNative
    //     ? options.expectedCurrencyOwed0.quotient
    //     : options.expectedCurrencyOwed1.quotient
    //   const token = options.expectedCurrencyOwed0.currency.isNative
    //     ? (options.expectedCurrencyOwed1.currency as Token)
    //     : (options.expectedCurrencyOwed0.currency as Token)
    //   const tokenAmount = options.expectedCurrencyOwed0.currency.isNative
    //     ? options.expectedCurrencyOwed1.quotient
    //     : options.expectedCurrencyOwed0.quotient

    //   calldatas.push(Payments.encodeUnwrapWETH9(ethAmount, recipient))
    //   calldatas.push(Payments.encodeSweepToken(token, tokenAmount, recipient))
    // }

    return calldata
  }

  public static collectCallParameters(options: CollectOptions): MethodParameters {
    const calldata = this.encodeCollect(options)

    return {
      calldata,
      value: toHex(0)
    }
  }

  /**
   * Produces the calldata for completely or partially exiting a position
   * @param position The position to exit
   * @param options Additional information necessary for generating the calldata
   * @returns The call parameters
   */
  public static removeCallParameters(position: Position, options: RemoveLiquidityOptions): MethodParameters {
    let calldata;

    const tokenId = toHex(options.tokenId)
    const recipient=options.recipient

    // construct a partial position with a percentage of liquidity
    const partialPosition = new Position({
      pool: position.pool,
      liquidity: options.liquidityPercentage.multiply(position.liquidity).quotient,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper
    })
    invariant(JSBI.greaterThan(partialPosition.liquidity, ZERO), 'ZERO_LIQUIDITY')

    // slippage-adjusted underlying amounts
    const { amount0: amount0Min, amount1: amount1Min } = partialPosition.burnAmountsWithSlippage(
      options.slippageTolerance
    )

    // if (options.permit) {
    //   calldatas.push(
    //     NonfungiblePositionManager.INTERFACE.encodeFunctionData('permit', [
    //       validateAndParseAddress(options.permit.spender),
    //       tokenId,
    //       toHex(options.permit.deadline),
    //       options.permit.v,
    //       options.permit.r,
    //       options.permit.s
    //     ])
    //   )
    // }

    // remove liquidity

    calldata=this.INTERFACE.encodeFunctionData('burn', [
        tokenId,
        partialPosition.liquidity.toString(),
        recipient,
        options.unwrapVault,
        amount0Min.toString(),
        amount1Min.toString()
    ])
    

    return {
      calldata,
      value: toHex(0)
    }
  }

}