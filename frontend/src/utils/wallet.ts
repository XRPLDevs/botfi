/**
 * ウォレット関連の共通ユーティリティ
 */

import { getNetworkConfig } from '@/config/constants'
import type { Wallet } from '@/stores/wallet.store'

/**
 * ウォレットとネットワークの基本バリデーション
 * @param wallet - ウォレットオブジェクト
 * @returns ネットワーク設定
 * @throws バリデーションエラー
 */
export const validateWalletAndNetwork = (wallet: Wallet) => {
  if (!wallet.address) {
    throw new Error('Wallet address is required')
  }
  
  if (!wallet.networkType) {
    throw new Error('Network type is required')
  }
  
  const networkConfig = getNetworkConfig(wallet.networkType)
  if (!networkConfig) {
    throw new Error('Invalid network configuration')
  }
  
  return networkConfig
}

/**
 * GemWalletのインストール確認
 * @throws GemWalletがインストールされていない場合のエラー
 */
export const checkGemWallet = async (): Promise<void> => {
  const { isInstalled } = await import('@gemwallet/api')
  const hasGemWallet = await isInstalled()
  
  if (!hasGemWallet || !hasGemWallet.result.isInstalled) {
    throw new Error('GemWallet is not installed')
  }
}
