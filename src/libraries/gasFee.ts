import axios from "axios"

export class Gas {
    static async fee() {
        try {
            const result = (await axios.get("https://api.owlracle.info/v3/ftm/gas")).data
            let slow = { gwei: result.speeds[0].maxFeePerGas.toFixed(3), usd: result.speeds[0].estimatedFee.toFixed(3)}
            let standard = { gwei: result.speeds[1].maxFeePerGas.toFixed(3), usd: result.speeds[1].estimatedFee.toFixed(3)}
            let fast = { gwei: result.speeds[2].maxFeePerGas.toFixed(3), usd: result.speeds[2].estimatedFee.toFixed(3)}
            let instant = { gwei: result.speeds[3].maxFeePerGas.toFixed(3), usd: result.speeds[3].estimatedFee.toFixed(3)}
            return { slow, standard, fast, instant }
        } catch(e) {
            undefined
        }
    }
}

