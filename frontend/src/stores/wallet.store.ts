import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NetworkType } from '@/config/constants'
import { useState, useEffect } from 'react'

export enum WalletType {
  None = 'none',
  GemWallet = 'gemwallet',
  XRPScan = 'xrpscan',
}

export interface Wallet {
  walletType: WalletType
  networkType: NetworkType
  address: string
}

interface WalletStore {
  isConnected: boolean
  wallet: Wallet
  setWallet: ({ walletType, networkType, address }: { walletType: WalletType, networkType: NetworkType, address: string }) => void
  removeWallet: () => void
  setNetwork: (network: NetworkType) => void
  removeNetwork: () => void
}

const DEFAULT_WALLET: Wallet = {
  walletType: WalletType.None,
  networkType: 'mainnet', // 定数ファイルの型を使用
  address: '',
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      wallet: DEFAULT_WALLET,
      isConnected: false,
      
      setWallet: ({ walletType, networkType, address }: { walletType: WalletType, networkType: NetworkType, address: string }) => 
        set({ 
          wallet: { 
            walletType, 
            networkType, 
            address, 
          }, 
          isConnected: true 
        }),
      
      setNetwork: (network: NetworkType) => 
        set((state) => ({ 
          wallet: { 
            ...state.wallet, 
            networkType: network, 
          } 
        })),
      
      removeWallet: () => 
        set({ 
          wallet: DEFAULT_WALLET, 
          isConnected: false 
        }),
      
      removeNetwork: () => 
        set((state) => ({ 
          wallet: { 
            ...state.wallet, 
            networkType: 'mainnet', // 定数ファイルの型を使用
          } 
        })),
    }),
    { 
      name: 'wallet',
      // ハイドレーションエラーを防ぐための設定
      skipHydration: true,
    }
  )
)

// ハイドレーション完了後の初期化
export const useWalletStoreHydrated = () => {
  const store = useWalletStore()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return { ...store, isHydrated }
}
