import type { NextPage } from 'next'
import Script from 'next/script'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { fromWei } from '../utils/common'
import {
  init,
  mintTomToken,
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
  Transaction,
  mintJerryToken,
  checkUserJerryToken,
  addLiquidity,
  tomApprovePool,
  jerryApprovePool,
  getRatio,
  swapTomForJerry,
  swapJerryForTom,
  jerryAmountByTom,
  tomAmountByJerry,
  getLPToken
} from '../utils/web3client'

const Home: NextPage = () => {
  const [balance, setBalance] = useState(0)
  const [balanceJerry, setBalanceJerry] = useState(0)
  const [balanceInBank, setBalanceInBank] = useState(0)
  const [priceRatio, setPriceRatio] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [inputAmount, setInputAmount] = useState(0)
  const [transferAddr, setTransferAddr] = useState('')
  const [transferAmount, setTransferAmount] = useState(0)
  const [donateToken, setDonateToken] = useState(0)
  const [tomToJerryAmount, setTomToJerryAmount] = useState(0)
  const [jerryToTomAmount, setJerryToTomAmount] = useState(0)
  const [quoteJerryByTom, setQuoteJerryByTom] = useState(0)
  const [quoteTomByJerry, setQuoteTombyJerry] = useState(0)
  const [lpToken, setLPToken] = useState(0)
  const [transactions, setTransactions] = useState([] as Transaction[])

  const ownerAddr = process.env.NEXT_PUBLIC_OWNER_ADDR

  useEffect(() => {
    init()
      .then(() => {
        getIsLogin()
          .then((loggedIn) => {
            if (loggedIn) {
              checkToken()
              checkUserBankBalance()
              getUserTranstions()
              checkJerryToken()
              getTokenRatio()
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

    mintTomToken(`${amount}`)
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
        setBalance(parseFloat(balance))
      })
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  const checkUserBankBalance = () => {
    setIsLoading(true)

    getUserBalanceInBank()
      .then((tx) => {
        const balance = fromWei(tx)
        setBalanceInBank(parseFloat(balance))
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

  const mintJerry = async () => {
    setIsLoading(true)
    mintJerryToken('1000')
      .finally(() => {
        window.location.reload()
      })
  }

  const checkJerryToken = async () => {
    setIsLoading(true)
    checkUserJerryToken()
      .then((tx) => {
        const balance = fromWei(tx)
        setBalanceJerry(parseFloat(balance))
      })
  }

  const approvePool = async (tom: string, jerry: string) => {
    setIsLoading(true)

    await tomApprovePool(tom)
      .then()
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))

    await jerryApprovePool(jerry)
      .then()
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  const addLiquidityPool = async () => {
    setIsLoading(true)
    await approvePool('10000000', '1000000')
    setIsLoading(true)
    addLiquidity('10000000', '1000000')
      .finally(() => {
        setIsLoading(false)
        window.location.reload()
      })
  }

  const getLP = async () => {
    getLPToken().then(lp => setLPToken(parseFloat(lp)))
  }

  const getTokenRatio = async () => {
    getRatio().then((p) => {
      setPriceRatio(p)
    })
  }

  const swapTokenTomForJerry = async (amount: string) => {
    setIsLoading(true)
    swapTomForJerry(amount)
      .finally(() => window.location.reload())
  }

  const isTomToJerryInputValid = () => {
    return !isNaN(tomToJerryAmount) && tomToJerryAmount !== 0 && tomToJerryAmount <= 1000
  }

  const swapTokenJerryForTom = async (amount: string) => {
    setIsLoading(true)
    swapJerryForTom(amount)
      .finally(() => window.location.reload())
  }

  const isJerryToTomInputValid = () => {
    return !isNaN(jerryToTomAmount) && jerryToTomAmount !== 0 && jerryToTomAmount <= 1000
  }

  const getQuoteJerryByTom = async (amount: string) => {
    const amountFloat = parseFloat(amount)
    if (amountFloat > 0 && amountFloat <= 1000) {
      jerryAmountByTom(amount)
        .then(q => setQuoteJerryByTom(q))
    }
  }

  const getQuoteTomByJerry = async (amount: string) => {
    const amountFloat = parseFloat(amount)
    if (amountFloat > 0 && amountFloat <= 1000) {
      tomAmountByJerry(amount)
        .then(q => setQuoteTombyJerry(q))
    }
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
      case selectedAccount?.toLowerCase():
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
      default: {
        if (type != 'mint') result = from.slice(0, 10) + '...' + from.slice(-8)
        else result = from
      }
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
      <nav className="navbar navbar-light bg-dark fixed-top">
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
            {isLogin &&
              <>
                <img src="tom.png" style={{ marginTop: -10 }} alt="" width="43" height="35" />
                <span className="text-white ms-1 me-3" style={{ fontSize: 18 }}>{balance.toFixed(2)}</span>
                <img src="jerry.png" style={{ marginTop: 0 }} alt="" width="45" height="35" />
                <span className="text-white " style={{ fontSize: 18 }}>{balanceJerry.toFixed(2)}</span>
              </>
            }

            {!isLogin && <button className="btn btn-success" onClick={() => onLogin()}>Connect with MetaMask</button>}
          </div>
        </div>
      </nav>
      <main>
        {isLoading && <div className="loading">Loading&#8230;</div>}
        <div className="p-5 mb-4 bg-light rounded-3">
          <div className="container pt-5">
            <h1 className="display-5 fw-bold">Welcome</h1>
            <p className="col-md-8 fs-4">
              This is the most untrusted bank, nice to meet you <br />
              {
                isLogin &&
                <>
                  <span style={{ fontSize: 16 }} className="text-muted">Current balance in bank (only TomToken accepted)</span> <br />
                  <img src="tom.png" style={{ marginTop: -35 }} className="me-2" alt="" width="50" height="50" />
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
                    <input
                      type="number"
                      value={isNaN(inputAmount) || inputAmount == 0 ? '' : inputAmount}
                      className="form-control form-control-lg"
                      placeholder="Please input amount of TomToken"
                      onChange={(e) => setInputAmount(parseFloat(e.target.value))}
                    />
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
                      Mint Tom
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
                        onChange={(e) => setTransferAmount(parseFloat(e.target.value))}
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
                        onChange={(e) => setDonateToken(parseFloat(e.target.value))}
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

        {
          isLogin &&
          <>
            <div className="p-5 mb-4 bg-light rounded-3">
              <div className="container py-2">
                <h1 className="display-5 fw-bold">
                  Untrusted Swap
                  <img src="jerry.png" className="ms-2" style={{ marginTop: 2 }} alt="" width="60" height="45" />
                  <img src="transfer.png" className="mx-2" style={{ marginTop: 2 }} alt="" width="30" height="30" />
                  <img src="tom.png" style={{ marginTop: -3 }} alt="" width="50" height="45" />
                </h1>
                <p className="col-md-8 fs-4">
                  Swap your token in Tom/Jerry pool <br />

                  <>
                    <span style={{ fontSize: 16 }} className="text-muted">Current Jerry price for 1 Tom</span> <br />
                    <strong style={{ fontSize: 70 }}>{priceRatio.toFixed(5)}</strong>
                    <span className="text-muted ms-2">Jerry / Tom</span>
                  </>
                </p>
              </div>
            </div>

            <div className="container mb-5">
              {selectedAccount && ownerAddr && selectedAccount.toLowerCase() == ownerAddr.toLowerCase() &&
                <>
                  <p>lp : {lpToken}</p>
                  <div className="d-flex justify-content-start">
                    <button className="btn btn-warning mx-1" onClick={() => mintJerry()}>Mint Jerry</button>
                    <button className="btn btn-warning mx-1" onClick={() => addLiquidityPool()}>Add Liquidity</button>
                    <button className="btn btn-warning mx-1" onClick={() => getLP()}>Get LP Token</button>
                  </div>
                </>
              }
              <div className="row" style={{ marginTop: 60 }}>
                <div className="col-md-6 mt-3 mt-md-0">
                  <div className="card px-0 mx-0">
                    <div className="card-body">
                      <h3 className="card-title">Tom to Jerry</h3>
                      <span style={{ fontSize: 16 }} className="text-muted">Max 1000 token per swap</span> <br />
                      <input
                        type="number"
                        value={isNaN(tomToJerryAmount) || tomToJerryAmount == 0 ? '' : tomToJerryAmount}
                        className="form-control form-control-lg my-1"
                        placeholder="Please input amount of TomToken"
                        onChange={(e) => {
                          setTomToJerryAmount(parseFloat(e.target.value))
                          getQuoteJerryByTom(`${parseFloat(e.target.value)}`)
                        }}
                      />
                      <span
                        style={{ fontSize: 16 }}
                        className="text-muted"
                      >
                        {isTomToJerryInputValid() ? `~ ${quoteJerryByTom.toFixed(6)}` : '0'} Jerry
                      </span> <br />
                      <button
                        disabled={!isTomToJerryInputValid()}
                        className="btn btn-primary btn-lg my-1 w-100"
                        onClick={() => swapTokenTomForJerry(`${tomToJerryAmount}`)}
                      >
                        <strong>Swap</strong>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <div className="card px-0 mx-0">
                    <div className="card-body">
                      <h3 className="card-title">Jerry to Tom</h3>
                      <span style={{ fontSize: 16 }} className="text-muted">Max 1000 token per swap</span> <br />
                      <input
                        type="number"
                        value={isNaN(jerryToTomAmount) || jerryToTomAmount == 0 ? '' : jerryToTomAmount}
                        className="form-control form-control-lg my-1"
                        placeholder="Please input amount of JerryToken"
                        onChange={(e) => {
                          setJerryToTomAmount(parseFloat(e.target.value))
                          getQuoteTomByJerry(`${parseFloat(e.target.value)}`)
                        }}
                      />
                      <span
                        style={{ fontSize: 16 }}
                        className="text-muted"
                      >
                        {isJerryToTomInputValid() ? `~ ${quoteTomByJerry.toFixed(6)}` : '0'} Tom
                      </span> <br />
                      <button
                        disabled={!isJerryToTomInputValid()}
                        className="btn btn-primary btn-lg my-1 w-100"
                        onClick={() => swapTokenJerryForTom(`${jerryToTomAmount}`)}
                      >
                        <strong>Swap</strong>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        }
      </main>
      <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossOrigin="anonymous" />
    </div>
  )
}

export default Home
