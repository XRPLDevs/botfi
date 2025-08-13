'use client'

import React, { useCallback } from 'react'
import Typography from '@mui/material/Typography'
import { UI_MESSAGES } from '@/utils/messages'
import TrustlineButton from '@/app/_components/TrustlineButton'
import { Wallet } from '@/stores/wallet.store'

interface TrustlineNoSetSectionProps {
  wallet: Wallet
}

const TrustlineNoSetSection = React.memo(({ wallet }: TrustlineNoSetSectionProps) => {
  // 成功時のコールバックをメモ化
  const handleTrustlineSuccess = useCallback(() => {
    console.log('Trustline setup completed successfully')
  }, [])

  // エラー時のコールバックをメモ化
  const handleTrustlineError = useCallback((error: string) => {
    console.error('Trustline setup failed:', error)
  }, [])

  return (
    <div>
      <Typography variant="h6">{UI_MESSAGES.TRUSTLINE.NOT_SET}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        {UI_MESSAGES.TRUSTLINE.NOT_SET_DESCRIPTION}
      </Typography>
      
      <TrustlineButton 
        wallet={wallet}
        onSuccess={handleTrustlineSuccess}
        onError={handleTrustlineError}
      />
    </div>
  )
})

TrustlineNoSetSection.displayName = 'TrustlineNoSetSection'

export default TrustlineNoSetSection
