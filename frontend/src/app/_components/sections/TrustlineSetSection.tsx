'use client'

import React, { useCallback, useMemo } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import { useForm } from '@tanstack/react-form'

import { validateWalletAndNetwork, checkGemWallet } from '@/utils/wallet'
import { handleError } from '@/utils/errorHandling'
import { UI_MESSAGES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/messages'
import { processDeposit } from '@/utils/trustline'
import { useTxSubmit } from '@/hooks/useTxSubmit'
import { useTransactionState } from '@/hooks/useTransactionState'
import { useTrustline } from '@/hooks/useTrustline'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useTransactionHistory } from '@/hooks/useTransactionHistory'
import type { Wallet } from '@/stores/wallet.store'

interface TrustlineSetSectionProps {
  wallet: Wallet
}

const TrustlineSetSection = React.memo(({ wallet }: TrustlineSetSectionProps) => {
  const { isLoading, setIsLoading, error, setError, success, setSuccess, clearMessages } = useTransactionState()
  
  const submitTransaction = useTxSubmit()
  const trustlineQuery = useTrustline()
  const walletBalanceQuery = useWalletBalance()
  const transactionHistoryQuery = useTransactionHistory()

  // ネットワーク設定をメモ化
  const networkConfig = useMemo(() => {
    return validateWalletAndNetwork(wallet)
  }, [wallet])

  // エラークリア処理をメモ化
  const handleErrorClose = useCallback(() => {
    setError(null)
  }, [setError])

  // 成功メッセージクリア処理をメモ化
  const handleSuccessClose = useCallback(() => {
    setSuccess(null)
  }, [setSuccess])

  // デポジット処理をメモ化
  const handleDeposit = useCallback(async (amount: string) => {
    try {
      // 1. Loading開始
      setIsLoading(true)
      clearMessages()
      
      // バリデーション
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error(ERROR_MESSAGES.VALIDATION.INVALID_AMOUNT)
      }

      if (Number(amount) > 1000000) {
        throw new Error(ERROR_MESSAGES.VALIDATION.AMOUNT_TOO_HIGH)
      }

      // 2. 残高チェック
      const currentBalance = walletBalanceQuery.data
      if (!currentBalance) {
        throw new Error('残高の取得に失敗しました。再度お試しください。')
      }

      const depositAmount = Number(amount)
      const rlusdBalance = Number(currentBalance.RLUSD)
      
      if (rlusdBalance < depositAmount) {
        throw new Error(`残高が不足しています。現在の残高: ${rlusdBalance} RLUSD`)
      }

      // 3. GemWalletの確認
      await checkGemWallet()

      // 4. GemWalletを使用してトランザクションに署名
      const { signTransaction } = await import('@gemwallet/api')
      await processDeposit(
        wallet,
        networkConfig,
        amount,
        signTransaction,
        submitTransaction.mutateAsync
      )

      // 5. 成功時の処理
      setSuccess(SUCCESS_MESSAGES.DEPOSIT_COMPLETED(amount))
      
      // 6. 関連データの更新
      await Promise.all([
        trustlineQuery.refetch(),
        walletBalanceQuery.refetch(),
        transactionHistoryQuery.refetch()
      ])
      
      // 7. フォームをリセット
      depositForm.reset()
      
    } catch (error) {
      const errorMessage = handleError(error, ERROR_MESSAGES.SYSTEM.DEPOSIT_FAILED)
      setError(errorMessage)
    } finally {
      // 8. Loading状態のクリア
      setIsLoading(false)
    }
  }, [wallet, networkConfig, submitTransaction, trustlineQuery, walletBalanceQuery, transactionHistoryQuery, setIsLoading, clearMessages, setSuccess, setError])

  // Tanstack Formの初期化
  const depositForm = useForm({
    defaultValues: {
      amount: ''
    },
    onSubmit: async ({ value }) => {
      await handleDeposit(value.amount)
    }
  })

  return (
    <div>
      <Typography variant="h6">{UI_MESSAGES.TRUSTLINE.SET_COMPLETED}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        {UI_MESSAGES.TRUSTLINE.SET_COMPLETED_DESCRIPTION}
      </Typography>
      
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={handleErrorClose}>
          {error}
        </Alert>
      )}

      {/* 成功メッセージ */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={handleSuccessClose}>
          {success}
        </Alert>
      )}

      {/* 既存のフォーム部分を維持 */}
      <depositForm.Field
        name="amount"
        validators={{
          onChange: ({ value }) => {
            if (!value) return ERROR_MESSAGES.VALIDATION.AMOUNT_REQUIRED
            if (isNaN(Number(value)) || Number(value) <= 0) {
              return ERROR_MESSAGES.VALIDATION.INVALID_AMOUNT
            }
            if (Number(value) > 1000000) {
              return ERROR_MESSAGES.VALIDATION.AMOUNT_TOO_HIGH
            }
            
            // 残高チェック
            const currentBalance = walletBalanceQuery.data
            if (currentBalance) {
              const rlusdBalance = Number(currentBalance.RLUSD)
              if (Number(value) > rlusdBalance) {
                return `残高が不足しています。現在の残高: ${rlusdBalance} RLUSD`
              }
            }
            
            return undefined
          }
        }}
      >
        {(field) => (
          <TextField
            label={UI_MESSAGES.DEPOSIT.AMOUNT_LABEL}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            type="number"
            fullWidth
            error={field.state.meta.errors.length > 0}
            helperText={field.state.meta.errors[0]}
            sx={{ mb: 2 }}
          />
        )}
      </depositForm.Field>
      
      <Button 
        variant="contained" 
        disableElevation 
        onClick={() => depositForm.handleSubmit()}
        disabled={isLoading || !depositForm.state.canSubmit}
        sx={{ minWidth: 200 }}
      >
        {isLoading ? UI_MESSAGES.DEPOSIT.PROCESSING : UI_MESSAGES.DEPOSIT.DEPOSIT_RLUSD}
      </Button>
    </div>
  )
})

TrustlineSetSection.displayName = 'TrustlineSetSection'

export default TrustlineSetSection