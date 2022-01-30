import type { NextPage } from 'next'
import Script from 'next/script'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { fromWei } from '../utils/common'
import {
  init,
  mintToken,
  checkUserToken,
  deposit,
  approveBank,
  withdraw,
  login,
  getUserBalanceInBank,
  transferToken,
  addTransaction,
  getTransactions,
  selectedAccount,
  bankAddr,
  devAddr,
  Transaction
} from '../utils/web3client'

const Home: NextPage = () => {
  const [balance, setBalance] = useState(0)
  const [balanceInBank, setBalanceInBank] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [inputAmount, setInputAmount] = useState(0)
  const [transferAddr, setTransferAddr] = useState('')
  const [transferAmount, setTransferAmount] = useState(0)
  const [donateToken, setDonateToken] = useState(0)
  const [transactions, setTransactions] = useState([] as Transaction[])

  useEffect(() => {
    init()
      .then(() => {
        getIsLogin()
          .then((loggedIn) => {
            if (loggedIn) {
              checkToken()
              checkUserBankBalance()
              getUserTranstions()
            }
          })
      })
  }, [])

  const getIsLogin = async () => {
    const status = await window.localStorage.getItem('selectedAccount')
    if (!status || status == '') {
      setIsLogin(false)
    } else {
      setIsLogin(true)
    }
    return status && status != ''
  }

  const mint = (amount: number) => {
    setIsLoading(true)

    mintToken(`${amount}`)
      .then(async tx => {
        await addTransaction({
          from: selectedAccount.toLowerCase(),
          to: "-",
          amount: amount,
          type: "mint"
        })
        await checkToken()
        await getUserTranstions()
      })
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  const getUserTranstions = async () => {
    setIsLoading(true)
    const response = await getTransactions()

    if (response.status == 200) {
      setTransactions(response.data)
    }

    setIsLoading(false)
  }

  const checkToken = () => {
    setIsLoading(true)

    checkUserToken()
      .then(tx => {
        const balance = fromWei(tx)
        setBalance(parseInt(balance))
      })
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  const checkUserBankBalance = () => {
    setIsLoading(true)

    getUserBalanceInBank()
      .then((tx) => {
        const balance = fromWei(tx)
        setBalanceInBank(parseInt(balance))
      })
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  const userApproveBank = async (amount: number) => {
    setIsLoading(true)

    await approveBank(`${amount}`)
      .then()
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  const depositToken = async (amount: number) => {
    await userApproveBank(amount)
    setIsLoading(true)
    deposit(`${amount}`)
      .then(async tx => {
        await addTransaction({
          from: selectedAccount.toLowerCase(),
          to: bankAddr.toLowerCase(),
          amount: amount,
          type: "deposit"
        })
        await checkToken()
        await checkUserBankBalance()
        await getUserTranstions()
      })
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  const withdrawToken = async (amount: number) => {
    setIsLoading(true)
    withdraw(`${amount}`)
      .then(async () => {
        await addTransaction({
          from: bankAddr.toLowerCase(),
          to: selectedAccount.toLowerCase(),
          amount: amount,
          type: "withdraw"
        })
        await checkToken()
        await checkUserBankBalance()
        await getUserTranstions()
      })
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  const transfer = async () => {
    setIsLoading(true)
    transferToken(transferAmount.toString(), transferAddr)
      .then(async () => {
        await addTransaction({
          from: selectedAccount.toLowerCase(),
          to: transferAddr.toLowerCase(),
          amount: transferAmount,
          type: "transfer"
        })
        await checkToken()
        await getUserTranstions()
      })
      .catch(err => console.log(err))
      .finally(() => {
        setTransferAmount(0)
        setTransferAddr('')
        setIsLoading(false)
      })
  }

  const donate = async () => {
    setIsLoading(true)
    transferToken(donateToken.toString())
      .then(async () => {
        await addTransaction({
          from: selectedAccount.toLowerCase(),
          to: devAddr.toLowerCase(),
          amount: donateToken,
          type: "donate"
        })
        await checkToken()
        await getUserTranstions()
      })
      .catch(err => console.log(err))
      .finally(() => {
        setDonateToken(0)
        setIsLoading(false)
      })
  }

  const onLogin = async () => {
    await login()
  }

  const onBtnClicked = async (fn, amount) => {
    await fn(amount)
    setInputAmount(0)
  }

  const isValidInput = () => {
    return !isNaN(inputAmount) && inputAmount !== 0
  }

  const isTranserInputValid = () => {
    return !isNaN(transferAmount) && transferAmount !== 0 && transferAddr !== ''
  }

  const isDonateInputValid = () => {
    return !isNaN(donateToken) && donateToken !== 0
  }

  const formattedDateTime = (date: string) => {
    const d = new Date(date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: '2-digit', year: '2-digit' })
    const t = new Date(date).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })
    return t + ' ' + d
  }

  const nameTransactionFromAndTo = (from: string, type: string): string => {
    let result: string
    switch (from) {
      case selectedAccount.toLowerCase():
        result = "me"
        break
      case bankAddr.toLowerCase():
        result = "bank"
        break
      case devAddr.toLowerCase(): {
        if (type == 'donate') result = "developer"
        else result = from.slice(0, 10) + '...' + from.slice(-8)
        break
      }
      default: result = from.slice(0, 10) + '...' + from.slice(-8)
    }
    return result
  }

  const trClass = (type: string) => {
    switch (type) {
      case 'mint': return 'table-info'
      case 'deposit': return 'table-primary'
      case 'withdraw': return 'table-warning'
      case 'transfer': return 'table-light'
      case 'donate': return 'table-success'
      default: return 'table-success'
    }
  }

  return (
    <div>
      <Head>
        <title>Untrusted Bank</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossOrigin="anonymous"></link>
      </Head>
      <nav className="navbar navbar-light bg-dark">
        <div className="container">
          <a className="navbar-brand text-light">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              fill="currentColor" style={{ marginTop: -5 }} className="bi bi-boxes" viewBox="0 0 16 16">
              <path d="M7.752.066a.5.5 0 0 1 .496 0l3.75 2.143a.5.5 0 0 1 .252.434v3.995l3.498 2A.5.5 0 0 1 16 9.07v4.286a.5.5 0 0 1-.252.434l-3.75 2.143a.5.5 0 0 1-.496 0l-3.502-2-3.502 2.001a.5.5 0 0 1-.496 0l-3.75-2.143A.5.5 0 0 1 0 13.357V9.071a.5.5 0 0 1 .252-.434L3.75 6.638V2.643a.5.5 0 0 1 .252-.434L7.752.066ZM4.25 7.504 1.508 9.071l2.742 1.567 2.742-1.567L4.25 7.504ZM7.5 9.933l-2.75 1.571v3.134l2.75-1.571V9.933Zm1 3.134 2.75 1.571v-3.134L8.5 9.933v3.134Zm.508-3.996 2.742 1.567 2.742-1.567-2.742-1.567-2.742 1.567Zm2.242-2.433V3.504L8.5 5.076V8.21l2.75-1.572ZM7.5 8.21V5.076L4.75 3.504v3.134L7.5 8.21ZM5.258 2.643 8 4.21l2.742-1.567L8 1.076 5.258 2.643ZM15 9.933l-2.75 1.571v3.134L15 13.067V9.933ZM3.75 14.638v-3.134L1 9.933v3.134l2.75 1.571Z" />
            </svg>
            <span className="mx-2">Untrusted Bank</span></a>
          <div>
            {
              isLogin &&
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="currentColor" className="bi bi-coin text-white" viewBox="0 0 16 16">
                <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9H5.5zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518l.087.02z" />
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zm0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
              </svg>
            }
            {isLogin && <span className="text-white mx-2" style={{ fontSize: 18 }}>{balance}</span>}
            {!isLogin && <button className="btn btn-success" onClick={() => onLogin()}>Connect with MetaMask</button>}
          </div>
        </div>
      </nav>
      <main>
        {isLoading && <div className="loading">Loading&#8230;</div>}
        <div className="p-5 mb-4 bg-light rounded-3">
          <div className="container py-2">
            <h1 className="display-5 fw-bold" style={{}}>Welcome</h1>
            <p className="col-md-8 fs-4">
              This is the most untrusted bank, nice to meet you <br />
              {
                isLogin &&
                <>
                  <span style={{ fontSize: 16 }} className="text-muted">Current balance in bank</span> <br />
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" style={{ marginTop: -35, marginRight: 10 }} className="bi bi-coin" viewBox="0 0 16 16">
                    <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9H5.5zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518l.087.02z" />
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zm0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
                  </svg>
                  <strong style={{ fontSize: 70 }}>{balanceInBank}</strong>
                </>
              }
            </p>
            {
              !isLogin &&
              <span
                style={{ fontSize: 16 }}
                className="text-muted"
              >
                Please connect to the wallet with Metamask
              </span>
            }
          </div>
        </div>
        <div className="container my-5">
          {
            isLogin && (
              <div className="row">
                <div className="col-12">
                  <div className="mb-3">
                    <input type="number" value={isNaN(inputAmount) || inputAmount == 0 ? '' : inputAmount} className="form-control form-control-lg" placeholder="Please input amount of Token" onChange={(e) => setInputAmount(parseInt(e.target.value))} />
                  </div>
                </div>
                <div className="col-12 col-md-4 my-2">
                  <button
                    className="btn btn-secondary w-100 btn-lg"
                    disabled={isLoading || !isValidInput()} onClick={() => onBtnClicked(mint, inputAmount)}
                  >
                    <strong>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        style={{ marginTop: -5, marginRight: 10 }} fill="currentColor" className="bi bi-gem" viewBox="0 0 16 16">
                        <path d="M3.1.7a.5.5 0 0 1 .4-.2h9a.5.5 0 0 1 .4.2l2.976 3.974c.149.185.156.45.01.644L8.4 15.3a.5.5 0 0 1-.8 0L.1 5.3a.5.5 0 0 1 0-.6l3-4zm11.386 3.785-1.806-2.41-.776 2.413 2.582-.003zm-3.633.004.961-2.989H4.186l.963 2.995 5.704-.006zM5.47 5.495 8 13.366l2.532-7.876-5.062.005zm-1.371-.999-.78-2.422-1.818 2.425 2.598-.003zM1.499 5.5l5.113 6.817-2.192-6.82L1.5 5.5zm7.889 6.817 5.123-6.83-2.928.002-2.195 6.828z" />
                      </svg>
                      Mint Token
                    </strong>
                  </button>
                </div>
                <div className="col-12 col-md-4 my-2">
                  <button
                    className="btn btn-secondary w-100 btn-lg"
                    disabled={isLoading || !isValidInput()} onClick={() => onBtnClicked(depositToken, inputAmount)}
                  >
                    <strong>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        style={{ marginTop: -5, marginRight: 10 }} fill="currentColor" className="bi bi-arrow-up-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z" />
                      </svg>Deposit</strong>
                  </button>
                </div>
                <div className="col-12 col-md-4 my-2">
                  <button
                    className="btn btn-secondary w-100 btn-lg"
                    disabled={isLoading || !isValidInput()} onClick={() => onBtnClicked(withdrawToken, inputAmount)}
                  >
                    <strong>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        style={{ marginTop: -5, marginRight: 10 }} fill="currentColor" className="bi bi-arrow-down-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z" />
                      </svg>Withdraw</strong>
                  </button>
                </div>
              </div>
            )
          }
          {
            isLogin && (
              <div className="row" style={{ marginTop: 60 }}>
                <div className="col-md-6">
                  <div className="card px-0 mx-0">
                    <div className="card-body">
                      <h3 className="card-title">Transfer to...</h3>
                      <input
                        value={transferAddr}
                        className="form-control form-control-lg my-1"
                        placeholder="Please input address of receiver"
                        onChange={(e) => setTransferAddr(e.target.value)}
                      />
                      <input
                        type="number"
                        value={isNaN(transferAmount) || transferAmount == 0 ? '' : transferAmount}
                        className="form-control form-control-lg my-1"
                        placeholder="Please input amount of Token"
                        onChange={(e) => setTransferAmount(parseInt(e.target.value))}
                      />
                      <button
                        disabled={!isTranserInputValid()}
                        className="btn btn-warning btn-lg my-1 w-100"
                        onClick={() => transfer()}
                      >
                        <strong>Send</strong>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <div className="card px-0 mx-0">
                    <div className="card-body">
                      <h3 className="card-title">Donate to developer</h3>
                      <span style={{ fontSize: 16 }} className="text-muted">Thank you for your support</span> <br />
                      <input
                        style={{ marginTop: 29 }}
                        type="number"
                        value={isNaN(donateToken) || donateToken == 0 ? '' : donateToken}
                        className="form-control form-control-lg mb-1"
                        placeholder="Please input amount of Token"
                        onChange={(e) => setDonateToken(parseInt(e.target.value))}
                      />
                      <button
                        disabled={!isDonateInputValid()}
                        className="btn btn-primary btn-lg my-1 w-100"
                        onClick={() => donate()}
                      >
                        <strong>Send</strong>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          {isLogin && (
            <>
              <h2 className="mt-4">History</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">From</th>
                    <th scope="col">To</th>
                    <th scope="col">Type</th>
                    <th scope="col">Amout</th>
                    <th scope="col">When</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 && transactions.map((t, i) =>
                    <tr key={i} className={trClass(t.type)}>
                      <th scope="row">{i + 1}</th>
                      <td>{nameTransactionFromAndTo(t.from, t.type)}</td>
                      <td>{nameTransactionFromAndTo(t.to, t.type)}</td>
                      <td>{t.type}</td>
                      <td>{t.amount}</td>
                      <td>{formattedDateTime(t.createdAt)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </main>
      <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossOrigin="anonymous" />
    </div>
  )
}

export default Home
