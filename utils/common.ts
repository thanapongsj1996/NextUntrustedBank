import Web3 from 'web3'
import BN from 'bn.js'

export const toWei = (amount: string): BN => {
    if (!amount || amount.length == 0) {
        return new BN(0, 10)
    }
    const wei = Web3.utils.toWei(amount)
    return new BN(wei, 10)
}

export const fromWei = (amount: string): string => {
    try {
        return Web3.utils.fromWei(amount)
    } catch (err: any) {
        return ''
    }
}