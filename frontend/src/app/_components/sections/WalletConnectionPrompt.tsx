'use client'

import React from 'react'
import Typography from '@mui/material/Typography'
import { UI_MESSAGES } from '@/utils/messages'

const WalletConnectionPrompt = React.memo(() => {
  return (
    <div>
      <Typography variant="h6">{UI_MESSAGES.WALLET.CONNECT_REQUIRED}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {UI_MESSAGES.WALLET.CONNECT_DESCRIPTION}
      </Typography>
    </div>
  )
})

WalletConnectionPrompt.displayName = 'WalletConnectionPrompt'

export default WalletConnectionPrompt
