'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import { useTxSubmit } from '@/hooks/useTxSubmit'
import { useTrustline } from '@/hooks/useTrustline'
import { handleError } from '@/utils/errorHandling'
import { validateWalletAndNetwork, checkGemWallet } from '@/utils/wallet'
import { processTrustlineSetup } from '@/utils/trustline'
import { useTransactionState } from '@/hooks/useTransactionState'
import { UI_MESSAGES, ERROR_MESSAGES } from '@/utils/messages'
import { Wallet } from '@/stores/wallet.store'

interface TrustlineButtonProps {
  wallet: Wallet
  onSuccess?: () => void
  onError?: (error: string) => void
}

const TrustlineButton = React.memo(({ 
  wallet, 
  onSuccess, 
  onError 
}: TrustlineButtonProps) => {
  
  const { isLoading, setIsLoading, error, setError, clearMessages } = useTransactionState()
  
  const submitTransaction = useTxSubmit()
  const trustlineQuery = useTrustline()

  // ネットワーク設定をメモ化
  const networkConfig = useMemo(() => {
    return validateWalletAndNetwork(wallet)
  }, [wallet])

  // Trustline設定処理をメモ化
  const handleSetTrustline = useCallback(async () => {
    try {
      // 1. Loading開始
      setIsLoading(true)
      clearMessages()
      
      // 2. GemWalletの確認
      await checkGemWallet()

      // 3. Trustline設定の処理
      const { signTransaction } = await import('@gemwallet/api')
      await processTrustlineSetup(
        wallet,
        networkConfig,
        signTransaction,
        submitTransaction.mutateAsync,
        trustlineQuery.refetch
      )

      // 4. 成功時の処理
      onSuccess?.()
      
    } catch (error) {
      const errorMessage = handleError(error, ERROR_MESSAGES.SYSTEM.TRUSTLINE_SETUP_ERROR)
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      // 5. Loading状態のクリア
      setIsLoading(false)
    }
  }, [wallet, networkConfig, submitTransaction, trustlineQuery, onSuccess, onError, setIsLoading, clearMessages, setError])

  // エラークリア処理をメモ化
  const handleErrorClose = useCallback(() => {
    setError(null)
  }, [setError])

  return (
    <div>
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" onClose={handleErrorClose} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Trustline設定ボタン */}
      <Button 
        variant="contained" 
        disableElevation 
        loading={isLoading} 
        onClick={handleSetTrustline}
        sx={{ minWidth: 200 }}
      >
        {isLoading ? UI_MESSAGES.WALLET.PLEASE_WAIT : UI_MESSAGES.TRUSTLINE.ALLOW_RECEPTION}
      </Button>
    </div>
  )
})

TrustlineButton.displayName = 'TrustlineButton'

export default TrustlineButton
