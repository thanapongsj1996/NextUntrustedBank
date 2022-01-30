import Web3 from 'web3'
import axios from 'axios'
import { AbiItem } from 'web3-utils'
import TokenContract from '../build-contract/contracts/Token.json'
import { Token } from '../types/web3-v1-contracts/Token'
import BankContract from '../build-contract/contracts/Bank.json'
import { Bank } from '../types/web3-v1-contracts/Bank'
import { toWei } from './common'

export let selectedAccount: string
let tokenContract: Token
let bankContract: Bank
let isInitialized: boolean = false
const tokenAddr = process.env.NEXT_PUBLIC_TOKEN_ADDR
export const bankAddr = process.env.NEXT_PUBLIC_BANK_ADDR
export const devAddr = process.env.NEXT_PUBLIC_DEV_ADDR
const baseEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT

export const login = async () => {
    let provider = (window as any).ethereum

    if (typeof provider !== 'undefined') {
        provider
            .request({ method: 'eth_requestAccounts' })
            .then(async accounts => {
                if (accounts && accounts.length > 0) {
                    selectedAccount = accounts[0]
                    await window.localStorage.setItem('selectedAccount', selectedAccount)
                    console.log(`selectedAccount is ${selectedAccount}`)
                } else {
                    await window.localStorage.removeItem('selectedAccount')
                }
                window.location.reload()
            })
            .catch(err => {
                console.log(err)
                return
            })
    }
}

export const logout = () => {
    let provider = (window as any).ethereum

    if (typeof provider !== 'undefined') {
        provider.on('disconnect', () => { })
    }
}

export const init = async () => {
    let provider = (window as any).ethereum

    if (typeof provider !== 'undefined') {

        const userAcc = await window.localStorage.getItem('selectedAccount')
        if (userAcc && userAcc != '') {
            selectedAccount = userAcc
        }

        provider.on('accountsChanged', async accounts => {
            if (accounts && accounts.length > 0) {
                selectedAccount = accounts[0]
                await window.localStorage.setItem('selectedAccount', selectedAccount)
                console.log(`switch to selectedAccount is ${selectedAccount}`)
            } else {
                console.log('remove account from storage')
                await window.localStorage.removeItem('selectedAccount')
            }
            window.location.reload()
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

export const getUserBalanceInBank = async () => {
    if (!isInitialized) await init()

    return bankContract.methods.checkUserBalance().call({ from: selectedAccount })
}

export const transferToken = async (amount: string, account?: string | null) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    const receiverArr = account ? account : devAddr
    return tokenContract.methods.transfer(receiverArr, amountWei).send({ from: selectedAccount })
}

export type Transaction = {
    from: string,
    to: string,
    amount: number,
    type: string,
    createdAt?: string
}
export const addTransaction = async (payload: Transaction) => {
    await axios.post(`${baseEndpoint}/transactions`, payload)
}
export const getTransactions = async () => {
    return axios.get(`${baseEndpoint}/transactions/${selectedAccount.toLowerCase()}`)
}
