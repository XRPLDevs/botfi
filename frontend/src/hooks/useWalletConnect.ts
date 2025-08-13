import { useEffect, useCallback } from 'react'
import { isInstalled, getAddress, getNetwork, on } from "@gemwallet/api";
import { useWalletStore, WalletType } from '@/stores/wallet.store'
import { NetworkType } from '@/config/constants'

// ネットワーク文字列の型定義
type GemWalletNetwork = 'Mainnet' | 'Testnet' | 'Devnet' | 'mainnet' | 'testnet' | 'devnet'

// ネットワークオブジェクトの型定義
interface GemWalletNetworkObject {
  name: string
  description: string
  server: string
}

// ネットワーク変換の共通関数
const convertNetworkToType = (network: GemWalletNetwork | GemWalletNetworkObject): NetworkType => {
  // オブジェクト型の場合はnameプロパティを使用
  const networkString = typeof network === 'string' ? network : network.name
  
  const normalizedNetwork = networkString.toLowerCase()
  
  switch (normalizedNetwork) {
    case 'mainnet':
      return 'mainnet'
    case 'testnet':
      return 'testnet'
    case 'devnet':
      return 'devnet'
    default:
      return 'mainnet' // デフォルトはmainnet
  }
}

export function useWalletConnect() {
  const { setWallet, setNetwork } = useWalletStore()

  const connect = useCallback(async () => {
    try {
      // GemWalletのインストール確認
      const hasGemWallet = await isInstalled()
      if (!hasGemWallet?.result?.isInstalled) {
        throw new Error('GemWallet is not installed. Please install it first.')
      }

      // アドレス取得
      const addressResponse = await getAddress()
      if (!addressResponse.result?.address) {
        throw new Error('Failed to get wallet address from GemWallet.')
      }

      // ネットワーク取得
      const networkResponse = await getNetwork()
      if (!networkResponse.result?.network) {
        throw new Error('Failed to get network information from GemWallet.')
      }

      const network = networkResponse.result.network as GemWalletNetwork
      const networkType = convertNetworkToType(network)

      // ウォレット情報を設定（ネットワーク情報も含める）
      setWallet({
        walletType: WalletType.GemWallet,
        networkType: networkType,
        address: addressResponse.result.address,
      })
      // setNetworkは不要（setWalletで既に設定済み）
    } catch (error) {
      console.error('Wallet connection failed:', error)
      throw error
    }
  }, [setWallet]) // setNetworkの依存関係を削除

  // ネットワーク変更イベントの処理
  const handleNetworkChange = useCallback((response: { network: GemWalletNetwork }) => {
    const networkType = convertNetworkToType(response.network)
    // ネットワーク変更時は、既存のウォレット情報を保持してネットワークのみ更新
    setNetwork(networkType)
  }, [setNetwork])

  useEffect(() => {
    // ネットワーク変更イベントのリスナーを設定
    on("networkChanged", handleNetworkChange)

    // クリーンアップ関数
    return () => {
      // イベントリスナーの適切なクリーンアップ
      // 注意: GemWallet APIのクリーンアップ方法は要確認
      on("networkChanged", () => {})
    }
  }, [handleNetworkChange])

  return {
    connect,
  }
}
