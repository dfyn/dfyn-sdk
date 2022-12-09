import { defaultAbiCoder, Interface } from "@ethersproject/abi";
import MasterDeployerAbi from "./abis/MasterDeployer.json"
import {  TICK_SPACINGS, V2_FACTORY_ADDRESS } from "./constants";
import { Pool } from "./entities";
import { MethodParameters, toHex } from "./utils";

export abstract class MasterDeployer {
    public static INTERFACE: Interface = new Interface(MasterDeployerAbi)

   /**
   * Cannot be constructed.
   */
  private constructor() {}

  private static encodeCreate(pool: Pool): string {
    console.log([pool.token0.address, pool.token1.address, pool.sqrtRatioX96, TICK_SPACINGS[pool.fee]])
    const deployData = defaultAbiCoder.encode(
        ["address", "address", "uint160", "uint24"],
        [pool.token0.address, pool.token1.address, pool.sqrtRatioX96.toString(), TICK_SPACINGS[pool.fee]]
        );
        console.log(deployData)
        const x= this.INTERFACE.encodeFunctionData('deployPool', [
            V2_FACTORY_ADDRESS[pool.token0.chainId],
            deployData
        ])
        console.log(x)
    return x
  }

  public static createCallParameters(pool: Pool): MethodParameters {
    return {
      calldata: this.encodeCreate(pool),
      value: toHex(0)
    }
  }

}