import { ISSUERS, DEPOSIT_WALLET } from './tokens';

// ネットワーク設定の定数
export const NETWORKS = {
  mainnet: 'mainnet',
  testnet: 'testnet',
  devnet: 'devnet',
} as const;

export type NetworkType = (typeof NETWORKS)[keyof typeof NETWORKS];

// ネットワーク設定の取得関数
export function getNetworkConfig(_network: NetworkType) {
  return {
    BRLUSD_ISSUER: ISSUERS.bRLUSD,
    RLUSD_ISSUER: ISSUERS.RLUSD,
    DEPOSIT_WALLET,
  };
}

// 全ネットワーク設定の取得
export function getAllNetworkConfigs() {
  return {
    mainnet: getNetworkConfig('mainnet'),
    testnet: getNetworkConfig('testnet'),
    devnet: getNetworkConfig('devnet'),
  };
}

// XRPLクライアント用の設定（従来のNETWORK_CONFIGと互換性を保持）
export const NETWORK_CONFIG = getAllNetworkConfigs();

// ネットワークURL設定（必要に応じて拡張可能）
export const NETWORK_URLS = {
  mainnet: 'wss://xrplcluster.com',
  testnet: 'wss://s.altnet.rippletest.net:51233',
  devnet: 'wss://s.devnet.rippletest.net:51233',
} as const;

// ネットワーク設定の検証関数
export function validateNetworkConfig(network: NetworkType): boolean {
  const config = getNetworkConfig(network);
  return !!(config.BRLUSD_ISSUER && config.RLUSD_ISSUER && config.DEPOSIT_WALLET);
}
