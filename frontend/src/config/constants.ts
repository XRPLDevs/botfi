// ネットワーク設定
export const NETWORK_CONFIG = {
  mainnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU',
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC'
  },
  testnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // テストネット用のアドレスに変更
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV', // テストネット用のアドレスに変更
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC' // テストネット用のアドレスに変更
  },
  devnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // デブネット用のアドレスに変更
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV', // デブネット用のアドレスに変更
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC' // デブネット用のアドレスに変更
  }
} as const

// ネットワークURL設定
export const NETWORK_URLS = {
  mainnet: 'wss://xrplcluster.com/',
  testnet: 'wss://s.altnet.rippletest.net:51233/',
  devnet: 'wss://s.devnet.rippletest.net:51233/',
} as const

// 型定義
export type NetworkType = keyof typeof NETWORK_CONFIG
export type NetworkConfig = typeof NETWORK_CONFIG[NetworkType]
export type NetworkUrl = typeof NETWORK_URLS[NetworkType]

// ヘルパー関数（安全なネットワーク設定取得）
export function getNetworkConfig(networkType: string | undefined): NetworkConfig {
  // networkTypeが有効な値でない場合はmainnetをデフォルトとして使用
  if (!networkType || networkType === 'none' || !(networkType in NETWORK_CONFIG)) {
    return NETWORK_CONFIG.mainnet
  }
  return NETWORK_CONFIG[networkType as NetworkType]
}

// ネットワークURL取得関数
export function getNetworkUrl(networkType: string): string {
  if (!Object.keys(NETWORK_URLS).includes(networkType)) {
    throw new Error(`Invalid network type: ${networkType}`)
  }
  return NETWORK_URLS[networkType as NetworkType]
}

// ネットワークタイプ検証関数
export function validateNetworkType(networkType: string): boolean {
  return Object.keys(NETWORK_URLS).includes(networkType)
}

// デフォルト設定（mainnet）
export const DEFAULT_NETWORK_CONFIG = NETWORK_CONFIG.mainnet
