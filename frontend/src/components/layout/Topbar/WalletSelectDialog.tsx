'use client'

import { Dialog, DialogTitle, DialogContent, Button } from '@mui/material'
import { useWalletConnect } from '@/hooks/useWalletConnect'

interface WalletSelectDialogProps {
  open: boolean
  onClose: () => void
}

export default function WalletSelectDialog({ open, onClose }: WalletSelectDialogProps) {
  const { connect } = useWalletConnect()

  const handleClose = () => {
    onClose()
  }

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error(error)
    } finally {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Connect Wallet</DialogTitle>
      <DialogContent>
        <Button variant="contained" disableElevation fullWidth onClick={handleConnect}>
          Connect Wallet
        </Button>
      </DialogContent>
    </Dialog>
  )
}
