'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useWalletStore } from '@/stores/wallet.store'
import WalletMenuButton from '@/components/layout/Topbar/WalletMenuButton'
import WalletSelectDialog from '@/components/layout/Topbar/WalletSelectDialog'

const Box = dynamic(() => import('@mui/material/Box'), { ssr: false });

export default function ButtonAppBar() {
  const [walletSelectDialogOpen, setWalletSelectDialogOpen] = useState(false)

  const { removeWallet, isConnected, wallet } = useWalletStore()

  const handleOpenWalletSelectDialog = () => {
    setWalletSelectDialogOpen(true)
  }

  const handleCloseWalletSelectDialog = () => {
    setWalletSelectDialogOpen(false)
  }

  const handleDisconnect = () => {
    removeWallet()
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BotFi
          </Typography>
          {isConnected && (
            <WalletMenuButton
              address={wallet.address}
              networkType={wallet.networkType}
              onDisconnect={handleDisconnect}
            />
          )}
          {!isConnected && (
            <Button variant="outlined" color="inherit" onClick={handleOpenWalletSelectDialog}>
              Connect
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <WalletSelectDialog open={walletSelectDialogOpen} onClose={handleCloseWalletSelectDialog} />
    </Box>
  );
}
