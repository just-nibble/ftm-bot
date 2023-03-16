import { ethers, Log } from "ethers"
import { config } from "../Config/config"
const hex2dec = require('hex2dec');
import { Token } from "./tokens";

export class Transaction {
    private static provider(network: string) {
        return network.toLowerCase() =="mainnet" ? 
        new ethers.JsonRpcProvider(config.mainnet.rpc, { name: config.mainnet.name, chainId: config.mainnet.chainId }) :
        new ethers.JsonRpcProvider(config.testnet.rpc, { name: config.testnet.name, chainId: config.testnet.chainId })
    }

    private static toDateTime(secs: number) {
        var t = new Date(1970, 0, 1);
        t.setSeconds(secs);
        return t.toString();
    }

    static async getTxnInfo(hash: string, network: string) {
        try {
            let provider = this.provider(network)
            let txn = await provider?.getTransaction(hash)
            let logs = (await txn?.wait())?.logs
            let coin_amt = Number(ethers.formatEther(String(txn?.value)))
            let to_addr = String(txn?.to)
            let status = (await txn?.wait())?.status == 1 ? "SUCCESS" : (await txn?.wait())?.status == 0 ? "FAIL" : "PENDING"
            let fee = ethers.formatEther(String(Number(txn?.gasPrice?.toString()) * Number((await txn?.wait())?.gasUsed.toString())))
            let blocktime = await provider?.getBlock(String(txn?.blockHash))
            let time = this.toDateTime(Number(blocktime?.timestamp))

            let tokenTransferList: any[] = [];

            async function getLogs(log: Log) {
                let checker = (await Token.getTokenInfo(String(log.address), network))?.decimals
                if (typeof checker == "number" && log.topics[2] != undefined) {
                    let contract_address = log.address
                    let token_txns_addr = `0x${log.topics[2]?.slice(26)}`
                    let token_sym = (await (Token.getTokenInfo(String(contract_address), network)))?.symbol
                    let token_decimal = (await (Token.getTokenInfo(String(contract_address), network)))?.decimals
                    let hex_val = hex2dec.hexToDec(log.data)
                    let token_amt = Number(Number(hex_val/ (10 ** Number(token_decimal))).toFixed(5))
                    var tokenTransferInfo = { name: token_sym, from: String(txn?.from), to: token_txns_addr, amount: token_amt.toFixed(6) }
                    // console.log(tokenTransferInfo)
                    tokenTransferList.push(tokenTransferInfo)
                }
            }

            const tkn_txn = async() => {
                //@ts-ignore
                for (let log of logs) {
                    await getLogs(log)
                }
                console.log("done")
            }

            await tkn_txn()

            return {status: status, sender: String(txn?.from), reciever: to_addr, amount: coin_amt, time: time, fee: Number(Number(fee).toFixed(5)), tokenTransfers: tokenTransferList }
        } catch(e) {
            return undefined
        }
    }
}
