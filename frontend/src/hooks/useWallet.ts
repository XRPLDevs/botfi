'use client';

import { useWalletStore } from '@/stores/wallet.store';
import type { WalletType } from '@/types/wallet';

export function useWallet() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const account = useWalletStore((s) => s.account);
  const connectFn = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);

  const connect = async (walletType: WalletType) => {
    await connectFn(walletType);
  };

  return {
    isConnected,
    account,
    connect,
    disconnect,
  };
}
