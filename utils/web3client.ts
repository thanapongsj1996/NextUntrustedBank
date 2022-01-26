import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import TokenContract from '../build/contracts/Token.json'
import { Token } from '../types/web3-v1-contracts/Token'
import BankContract from '../build/contracts/Bank.json'
import { Bank } from '../types/web3-v1-contracts/Bank'
import { toWei } from './common'

let selectedAccount: string
let tokenContract: Token
let bankContract: Bank
let isInitialized: boolean = false
const tokenAddr = process.env.NEXT_PUBLIC_TOKEN_ADDR
const bankAddr = process.env.NEXT_PUBLIC_BANK_ADDR

export const init = async () => {
    let provider = (window as any).ethereum

    if (typeof provider !== 'undefined') {
        provider
            .request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                selectedAccount = accounts[0]
                console.log(`selectedAccount is ${selectedAccount}`)
            })
            .catch(err => {
                console.log(err)
                return
            })

        provider.on('accountsChanged', accounts => {
            selectedAccount = accounts[0]
            console.log(`selectedAccount is ${selectedAccount}`)
        })
    }

    const web3 = await new Web3(provider)
    tokenContract = await new web3.eth.Contract(TokenContract.abi as AbiItem[], tokenAddr) as any as Token
    bankContract = await new web3.eth.Contract(BankContract.abi as AbiItem[], bankAddr) as any as Bank

    isInitialized = true
}

export const mintToken = async (amount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    return tokenContract.methods.mint(amountWei).send({ from: selectedAccount })
}

export const approveBank = async (amount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    return tokenContract.methods.approve(bankAddr, amountWei).send({ from: selectedAccount })
}

export const deposit = async (amount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    return bankContract.methods.deposit(amountWei).send({ from: selectedAccount })
}

export const withdraw = async (amount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    return bankContract.methods.withdraw(amountWei).send({ from: selectedAccount })
}

export const checkUserToken = async (): Promise<string> => {
    if (!isInitialized) await init()

    return tokenContract.methods.balanceOf(selectedAccount).call()
}
