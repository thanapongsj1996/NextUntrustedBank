import Web3 from 'web3'
import axios from 'axios'
import { AbiItem, fromWei } from 'web3-utils'
import TomTokenContract from '../build-contract/contracts/TomToken.json'
import { TomToken } from '../types/web3-v1-contracts/TomToken'
import JerryTokenContract from '../build-contract/contracts/JerryToken.json'
import { JerryToken } from '../types/web3-v1-contracts/JerryToken'
import BankContract from '../build-contract/contracts/Bank.json'
import { Bank } from '../types/web3-v1-contracts/Bank'
import PoolContract from '../build-contract/contracts/Pool.json'
import { Pool } from '../types/web3-v1-contracts/Pool'
import { toWei } from './common'

export let selectedAccount: string
let tomTokenContract: TomToken
let jerryTokenContract: JerryToken
let bankContract: Bank
let poolContract: Pool
let isInitialized: boolean = false

const tomTokenAddr = process.env.NEXT_PUBLIC_TOM_TOKEN_ADDR
const jerryTokenAddr = process.env.NEXT_PUBLIC_JERRY_TOKEN_ADDR
const poolAddr = process.env.NEXT_PUBLIC_POOL_ADDR
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
    await web3.eth.getAccounts(async (err, acc) => {
        if (!err && acc.length == 0) await window.localStorage.removeItem('selectedAccount')
    })
    tomTokenContract = await new web3.eth.Contract(TomTokenContract.abi as AbiItem[], tomTokenAddr) as any as TomToken
    jerryTokenContract = await new web3.eth.Contract(JerryTokenContract.abi as AbiItem[], jerryTokenAddr) as any as JerryToken
    poolContract = await new web3.eth.Contract(PoolContract.abi as AbiItem[], poolAddr) as any as Pool
    bankContract = await new web3.eth.Contract(BankContract.abi as AbiItem[], bankAddr) as any as Bank

    isInitialized = true
}

export const mintTomToken = async (amount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    return tomTokenContract.methods.mint(amountWei).send({ from: selectedAccount })
}

export const approveBank = async (amount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    return tomTokenContract.methods.approve(bankAddr, amountWei).send({ from: selectedAccount })
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

    return tomTokenContract.methods.balanceOf(selectedAccount).call()
}

export const getUserBalanceInBank = async () => {
    if (!isInitialized) await init()
    console.log('selectedAccount: ', selectedAccount)
    return bankContract.methods.checkUserBalance().call({ from: selectedAccount })
}

export const transferToken = async (amount: string, account?: string | null) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    const receiverArr = account ? account : devAddr
    return tomTokenContract.methods.transfer(receiverArr, amountWei).send({ from: selectedAccount })
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


// Jerry Token
export const mintJerryToken = async (amount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(amount)
    return jerryTokenContract.methods.mint(amountWei).send({ from: selectedAccount })
}
export const checkUserJerryToken = async (): Promise<string> => {
    if (!isInitialized) await init()

    return jerryTokenContract.methods.balanceOf(selectedAccount).call()
}
export const addLiquidity = async (tomAmout: string, jerryAmount: string) => {
    if (!isInitialized) await init()

    return poolContract.methods.addLiquidity(toWei('1500000'), toWei('100000')).send({ from: selectedAccount })
}
export const tomApprovePool = async (tomAmount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(tomAmount)
    return tomTokenContract.methods.approve(poolAddr, amountWei).send({ from: selectedAccount })
}
export const jerryApprovePool = async (jerryAmount: string) => {
    if (!isInitialized) await init()

    const amountWei = toWei(jerryAmount)
    return jerryTokenContract.methods.approve(poolAddr, amountWei).send({ from: selectedAccount })
}
export const getRatio = async () => {
    if (!isInitialized) await init()

    const tomBalance = await tomTokenContract.methods.balanceOf(poolAddr).call()
    const jerryBalance = await jerryTokenContract.methods.balanceOf(poolAddr).call()

    const tomPrice = parseFloat(fromWei(tomBalance))
    const jerryPrice = parseFloat(fromWei(jerryBalance))

    if (tomPrice == 0) return 0
    return jerryPrice / tomPrice
}

export const swapTomForJerry = async (tomIn: string) => {
    if (!isInitialized) await init()

    const tomInWei = toWei(tomIn)
    const quotePrice = await poolContract.methods.getJerryAmountByTom(tomInWei).call()
    const jerryOut = parseFloat(fromWei(quotePrice)) * 0.998

    await tomApprovePool(tomIn)
    return poolContract.methods.swapTomforJerry(tomInWei, toWei(`${jerryOut}`)).send({ from: selectedAccount })
}

export const swapJerryForTom = async (jerryIn: string) => {
    if (!isInitialized) await init()

    const jerryInWei = toWei(jerryIn)
    const tomOut = await tomAmountByJerry(jerryIn)

    await jerryApprovePool(jerryIn)
    return poolContract.methods.swapJerryforTom(jerryInWei, toWei(`${tomOut}`)).send({ from: selectedAccount })
}

const slippage = 0.998
export const jerryAmountByTom = async (tomIn: string) => {
    if (!isInitialized) await init()

    const tomInWei = toWei(tomIn)
    const quotePrice = await poolContract.methods.getJerryAmountByTom(tomInWei).call()
    return parseFloat(fromWei(quotePrice)) * slippage
}

export const tomAmountByJerry = async (jerryIn: string) => {
    if (!isInitialized) await init()

    const jerryInWei = toWei(jerryIn)
    const quotePrice = await poolContract.methods.getTomAmountByJerry(jerryInWei).call()
    return parseFloat(fromWei(quotePrice)) * slippage
}

export const getLPToken = async () => {
    if (!isInitialized) await init()

    let lpAmount = await poolContract.methods.balanceOf(selectedAccount).call()
    return fromWei(lpAmount)
}