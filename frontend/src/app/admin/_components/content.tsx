'use client'

import { isInstalled, setAccount } from "@gemwallet/api";
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useWalletStore } from '@/stores/wallet.store'

const coldWallet = 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU'

export default function Content() {
  const { wallet } = useWalletStore()

  const handleSetAccount = async () => {
    try {
      const hasGemWallet = await isInstalled()

      if (!hasGemWallet || !hasGemWallet.result.isInstalled) {
        throw new Error('GemWallet is not installed')
      }

      const asfRequireAuth = 2

      const response = await setAccount({
        clearFlag: asfRequireAuth,
      })

      console.log(response)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <div>
        {wallet.address === coldWallet && (
          <Typography variant="h6" component="h1">
            OK!Cold Wallet!
          </Typography>
        )}
        <Button variant="contained" onClick={handleSetAccount}>
          Set Account
        </Button>
      </div>
    </div>
  );
}
