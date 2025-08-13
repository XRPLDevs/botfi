'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { truncateAddress } from '@/utils/string'
import { NetworkType } from '@/config/constants'

interface WalletMenuButtonProps {
  address: string
  networkType: NetworkType
  onDisconnect: () => void
}

export default function WalletMenuButton({ address, networkType, onDisconnect }: WalletMenuButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        onClick={handleClick}
        sx={{
          textTransform: 'none',
        }}
      >
        {truncateAddress(address)}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'basic-button',
          },
        }}
      >
        <MenuItem>
          <Typography>
            {networkType}
          </Typography>
        </MenuItem>
        <MenuItem onClick={onDisconnect}>Logout</MenuItem>
      </Menu>
    </>
  )
}
