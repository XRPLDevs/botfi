import { ISSUERS } from './tokens';

// ネットワーク設定の定数
export const NETWORKS = {
  mainnet: 'mainnet',
  testnet: 'testnet',
  devnet: 'devnet',
} as const;

// XRPLクライアント用の設定（従来のNETWORK_CONFIGと互換性を保持）
export const NETWORK_CONFIG = {
  mainnet: {
    BRLUSD_ISSUER: ISSUERS.bRLUSD,
    RLUSD_ISSUER: ISSUERS.RLUSD,
  },
  testnet: {
    BRLUSD_ISSUER: ISSUERS.bRLUSD,
    RLUSD_ISSUER: ISSUERS.RLUSD,
  },
  devnet: {
    BRLUSD_ISSUER: ISSUERS.bRLUSD,
    RLUSD_ISSUER: ISSUERS.RLUSD,
  },
};
