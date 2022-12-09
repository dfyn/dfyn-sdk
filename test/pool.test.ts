import { getCreate2Address } from "@ethersproject/address"
import { keccak256 } from "@ethersproject/solidity"
import { V2_POOL_INIT_CODE_HASH } from "../src/constants"
import { defaultAbiCoder } from '@ethersproject/abi'

// TODO: replace the provider in these tests
describe('data', () => {
    it('Token', async () => {
        const salt0=keccak256(
            ['bytes'],
            [defaultAbiCoder.encode(['address', 'address'], ["0xC168E40227E4ebD8C1caE80F7a55a4F0e6D66C97".toLowerCase(), "0x16ECCfDbb4eE1A85A33f3A9B21175Cd7Ae753dB4".toLowerCase()])]
          )
       console.log(getCreate2Address(
            "0x68E776B2369696e589254cfc6d2ce4B29385952D",
            salt0,
            V2_POOL_INIT_CODE_HASH[137].toLowerCase()
          ))
        const salt1=keccak256(
            ['bytes'],
            [defaultAbiCoder.encode(['address', 'address'], ["0x16ECCfDbb4eE1A85A33f3A9B21175Cd7Ae753dB4".toLowerCase(), "0xC168E40227E4ebD8C1caE80F7a55a4F0e6D66C97".toLowerCase()])]
          )
       console.log(getCreate2Address(
            "0x68E776B2369696e589254cfc6d2ce4B29385952D",
            salt1,
            V2_POOL_INIT_CODE_HASH[137].toLowerCase()
          ))
    })
})