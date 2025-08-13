// 定数ファイルから再エクスポート
export { 
  getNetworkUrl, 
  validateNetworkType 
} from '@/config/constants'

export type { NetworkType } from '@/config/constants'

// 後方互換性のため、既存の列挙型も維持
export enum NetworkTypes {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Devnet = 'devnet',
}

export const NETWORKS = {
  [NetworkTypes.Mainnet]: 'wss://xrplcluster.com/',
  [NetworkTypes.Testnet]: 'wss://s.altnet.rippletest.net:51233/',
  [NetworkTypes.Devnet]: 'wss://s.devnet.rippletest.net:51233/',
} as const
