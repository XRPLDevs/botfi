'use client';

import { Loader2Icon } from 'lucide-react';
import { IconButton } from '@/components/icon-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toaster';
import { useMounted } from '@/hooks/useMounted';
import { useWallet } from '@/hooks/useWallet';
import type { WalletType } from '@/types/wallet';

export function WalletConnectButton({
  walletType,
  ...props
}: React.ComponentProps<'button'> & { walletType: WalletType }) {
  const { connect, disconnect, isConnected, account } = useWallet();

  const mounted = useMounted();

  const handleConnect = async () => {
    try {
      await connect(walletType);
      toast.success('Wallet connected');
    } catch (_error) {
      toast.error('Failed to connect wallet');
    }
  };

  if (!mounted)
    return (
      <IconButton {...props} disabled={true}>
        <Loader2Icon className="animate-spin" />
      </IconButton>
    );

  if (isConnected)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="cursor-pointer">
            {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>
            <p className="leading-7 text-sm">{account?.network.toUpperCase()}</p>
            <p className="leading-7 text-sm">{account?.address}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect}>Disconnect</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  return (
    <Button {...props} variant="ghost" onClick={handleConnect}>
      Connect Wallet
    </Button>
  );
}
