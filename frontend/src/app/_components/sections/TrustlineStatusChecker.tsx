'use client'

import React, { useCallback } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { UI_MESSAGES } from '@/utils/messages'

interface TrustlineStatusCheckerProps {
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const TrustlineStatusChecker = React.memo(({ 
  isLoading, 
  isError, 
  onRetry 
}: TrustlineStatusCheckerProps) => {
  // リトライ処理をメモ化
  const handleRetry = useCallback(() => {
    onRetry()
  }, [onRetry])

  if (isLoading) {
    return (
      <div>
        <Typography variant="h6">{UI_MESSAGES.TRUSTLINE.CHECKING_STATUS}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {UI_MESSAGES.WALLET.PLEASE_WAIT}
        </Typography>
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <Typography variant="h6" color="error">
          {UI_MESSAGES.ERROR.STATUS_CHECK_FAILED}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          {UI_MESSAGES.ERROR.STATUS_CHECK_FAILED_DESCRIPTION}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleRetry}
          sx={{ mt: 1 }}
        >
          {UI_MESSAGES.ERROR.RETRY}
        </Button>
      </div>
    )
  }

  return null
})

TrustlineStatusChecker.displayName = 'TrustlineStatusChecker'

export default TrustlineStatusChecker
