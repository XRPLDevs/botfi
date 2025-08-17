import { ISSUERS } from './tokens';

// ネットワーク設定の定数
export const NETWORKS = {
  mainnet: 'mainnet',
  testnet: 'testnet',
  devnet: 'devnet',
} as const;

// ネットワークごとのXRPLエンドポイント
export const XRPL_ENDPOINTS = {
  mainnet: [
    'wss://xrplcluster.com',
    'wss://s1.ripple.com',
    'wss://s2.ripple.com',
  ],
  testnet: [
    'wss://s.altnet.rippletest.net:51233',
    'wss://testnet.xrpl-labs.com',
  ],
  devnet: [
    'wss://s.devnet.rippletest.net:51233',
  ],
} as const;

// ネットワークごとの設定
export const NETWORK_CONFIG = {
  mainnet: {
    BRLUSD_ISSUER: ISSUERS.bRLUSD,
    RLUSD_ISSUER: ISSUERS.RLUSD,
    maxHistoryLimit: 200, // mainnetは制限が厳しい
    retryAttempts: 3,
  },
  testnet: {
    BRLUSD_ISSUER: ISSUERS.bRLUSD,
    RLUSD_ISSUER: ISSUERS.RLUSD,
    maxHistoryLimit: 1000, // testnetは比較的緩い
    retryAttempts: 2,
  },
  devnet: {
    BRLUSD_ISSUER: ISSUERS.bRLUSD,
    RLUSD_ISSUER: ISSUERS.RLUSD,
    maxHistoryLimit: 2000, // devnetは最も緩い
    retryAttempts: 1,
  },
} as const;

// ネットワークタイプの型
export type NetworkType = keyof typeof NETWORKS;

// エンドポイント取得関数
export function getXRPLEndpoint(network: NetworkType): string {
  const endpoints = XRPL_ENDPOINTS[network];
  // ランダムにエンドポイントを選択（負荷分散）
  return endpoints[Math.floor(Math.random() * endpoints.length)];
}

// ネットワーク設定取得関数
export function getNetworkConfig(network: NetworkType) {
  return NETWORK_CONFIG[network];
}
