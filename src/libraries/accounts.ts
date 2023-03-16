import Moralis from "moralis"
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { ethers } from "ethers";
import { config } from "../Config/config";

let starter = true

export class Account {
    private static provider(network: string) {
        return network.toLowerCase() =="mainnet" ? 
        new ethers.JsonRpcProvider(config.mainnet.rpc, { name: config.mainnet.name, chainId: config.mainnet.chainId }) :
        new ethers.JsonRpcProvider(config.testnet.rpc, { name: config.testnet.name, chainId: config.testnet.chainId })
    }

    static async getNativeBalance(address: string) {
        try {
            const provider = this.provider("mainnet")
            let balance = Number(ethers.formatEther((await provider.getBalance(address)))).toFixed(6)
            return balance
        } catch(e) {
            return undefined
        }
    }

    static async getTokenBalances(address: string) {
        try {
            if (starter == true) {
                await Moralis.start({ apiKey: config.moralis})
            }

            starter = false;

            let res = await Moralis.EvmApi.token.getWalletTokenBalances({
                address: address,
                chain: EvmChain.FANTOM
            })
        
            return res.toJSON()
        } catch(e) {
            return undefined
        }
    }
}


// Account.getTokenBalances("0x23d0f8944468F79FB06850c136a0E6B3Ee4a450F").then(e => console.log(e))