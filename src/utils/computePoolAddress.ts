import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { Token } from '../index'
import { V2_POOL_INIT_CODE_HASH } from '../constants'

/**
 * Computes a pool address
 * @param deployerAddress The Uniswap V3 factory address
 * @param tokenA The first token of the pair, irrespective of sort order
 * @param tokenB The second token of the pair, irrespective of sort order
 * @param initCodeHashManualOverride Override the init code hash used to compute the pool address if necessary
 * @returns The pool address
 */
export function computePoolAddress({
  deployerAddress,
  tokenA,
  tokenB,
  initCodeHashManualOverride
}: {
  deployerAddress: string
  tokenA: Token
  tokenB: Token
  initCodeHashManualOverride?: string
}): string {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
  const salt=keccak256(
    ['bytes'],
    [defaultAbiCoder.encode(['address', 'address'], [token0.address, token1.address])]
  )
  return getCreate2Address(
    deployerAddress,
    salt,
    initCodeHashManualOverride ?? V2_POOL_INIT_CODE_HASH[token0.chainId]
  )
}
