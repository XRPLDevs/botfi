import type { Payment } from 'xrpl'
/**
 * Trustline関連の共通ユーティリティ
 */

// 定数の定義
export const TRUSTLINE_LIMIT = '10000000'
export const CURRENCY_BOT = 'BOT'

/**
 * Trustline設定のトランザクション作成
 * @param wallet - ウォレットオブジェクト
 * @param networkConfig - ネットワーク設定
 * @returns TrustSetトランザクションオブジェクト
 */
export const createTrustlineTransaction = (wallet: { address: string }, networkConfig: { BOT_ISSUER: string }) => ({
  TransactionType: 'TrustSet' as const,
  Account: wallet.address,
  LimitAmount: {
    currency: CURRENCY_BOT,
    issuer: networkConfig.BOT_ISSUER,
    value: TRUSTLINE_LIMIT
  }
})

/**
 * Trustline設定の処理
 * @param wallet - ウォレットオブジェクト
 * @param networkConfig - ネットワーク設定
 * @param signTransaction - トランザクション署名関数
 * @param submitTransaction - トランザクション送信関数
 * @param refetchTrustline - Trustline状態の再取得関数
 * @returns 処理結果
 */
export const processTrustlineSetup = async (
  wallet: { address: string },
  networkConfig: { BOT_ISSUER: string },
  signTransaction: (transaction: any) => Promise<any>,
  submitTransaction: (signature: string) => Promise<any>,
  refetchTrustline: () => Promise<any>
) => {
  const transaction = createTrustlineTransaction(wallet, networkConfig)
  
  const response = await signTransaction({ transaction })
  
  if (response.type === 'reject' || !response.result?.signature) {
    throw new Error('Transaction rejected')
  }
  
  await submitTransaction(response.result.signature)
  await refetchTrustline()
  
  return response.result
}

/**
 * Deposit用のトランザクション作成
 * @param wallet - ウォレットオブジェクト
 * @param networkConfig - ネットワーク設定
 * @param amount - デポジット金額
 * @returns Paymentトランザクションオブジェクト
 */
export const createDepositTransaction = (
  wallet: { address: string }, 
  networkConfig: { RLUSD_ISSUER: string; DEPOSIT_WALLET: string }, 
  amount: string
): Payment => ({
  TransactionType: 'Payment',
  Account: wallet.address,
  Destination: networkConfig.DEPOSIT_WALLET,
  Amount: {
    currency: '524C555344000000000000000000000000000000', // RLUSD
    issuer: networkConfig.RLUSD_ISSUER,
    value: amount
  }
})

/**
 * Deposit処理
 * @param wallet - ウォレットオブジェクト
 * @param networkConfig - ネットワーク設定
 * @param amount - デポジット金額
 * @param signTransaction - トランザクション署名関数
 * @param submitTransaction - トランザクション送信関数
 * @returns 処理結果
 */
export const processDeposit = async (
  wallet: { address: string },
  networkConfig: { RLUSD_ISSUER: string; DEPOSIT_WALLET: string },
  amount: string,
  signTransaction: (transaction: any) => Promise<any>,
  submitTransaction: (signature: string) => Promise<any>
) => {
  const transaction = createDepositTransaction(wallet, networkConfig, amount)
  
  const response = await signTransaction({ transaction })
  
  if (response.type === 'reject' || !response.result?.signature) {
    throw new Error('Transaction rejected')
  }
  
  await submitTransaction(response.result.signature)
  
  return response.result
}
