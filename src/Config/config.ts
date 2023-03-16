import dotenv from "dotenv"

dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN || ""
const MORALIS = process.env.MORALIS || ""

export const config = {
    token: BOT_TOKEN,
    moralis: MORALIS,
    mainnet: {
        rpc: "https://rpc.ankr.com/fantom/",
        chainId: 250,
        name: "FTM"
    },
    testnet: {
        rpc: "https://rpc.testnet.fantom.network/",
        chainId: 0xfa2,
        name: "FTM"
    }
}