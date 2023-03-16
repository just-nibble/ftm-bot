import { ethers } from "ethers";
import { config } from "../Config/config";
import ABI from "../ABI/ERC20"

export class Token {
    private static provider(network: string) {
        return network.toLowerCase() =="mainnet" ? 
        new ethers.JsonRpcProvider(config.mainnet.rpc, { name: config.mainnet.name, chainId: config.mainnet.chainId }) :
        new ethers.JsonRpcProvider(config.testnet.rpc, { name: config.testnet.name, chainId: config.testnet.chainId })
    }

    static async getTokenInfo(token_address: string, network: string) {
        try {
            const provider = this.provider(network)
            const conract_instance = new ethers.Contract(token_address, ABI, provider)
            let address = token_address;
            let name = await conract_instance.name()
            let symbol = await conract_instance.symbol()
            let decimals = Number(await conract_instance.decimals())
            let totalSupply = Number(await conract_instance.totalSupply()) / Math.pow(10, decimals)
            return {address, name, symbol, decimals, totalSupply}
        } catch(e) {
            return undefined
        }
    }
}
