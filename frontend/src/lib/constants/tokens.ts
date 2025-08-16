// トークン関連の定数を一元管理
export const TOKENS = {
  BRLUSD: 'bRLUSD',
  PRO: 'PRO',
  RLUSD: 'RLUSD',
} as const;

// トークン名の型定義
export type TokenName = (typeof TOKENS)[keyof typeof TOKENS];

// 発行者アドレスの定数
export const ISSUERS = {
  [TOKENS.BRLUSD]: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU',
  [TOKENS.PRO]: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU',
  [TOKENS.RLUSD]: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
} as const;

// deposit addressの定数
export const DEPOSIT_ADDRESS = 'rf9yPn8HtzHTrTB1TyiWzQZtwHA6Huve4x';

// 表示名の定数
export const DISPLAY_NAMES = {
  [TOKENS.BRLUSD]: 'bRLUSD',
  [TOKENS.PRO]: 'PRO',
  [TOKENS.RLUSD]: 'RLUSD',
} as const;

// 説明文の定数
export const DESCRIPTIONS = {
  [TOKENS.BRLUSD]: 'bRLUSD Token',
  [TOKENS.PRO]: 'PRO',
  [TOKENS.RLUSD]: 'RLUSD',
} as const;

// 主要トークンの配列（Trustline設定対象）- bRLUSD、RLUSDを表示（PROは除外）
export const PRIMARY_TOKENS: readonly TokenName[] = [TOKENS.BRLUSD, TOKENS.RLUSD] as const;

// トークン設定の取得関数
export function getTokenConfig(tokenName: TokenName) {
  return {
    currency: tokenName,
    issuer: ISSUERS[tokenName],
    displayName: DISPLAY_NAMES[tokenName],
    description: DESCRIPTIONS[tokenName],
  };
}

// 全トークン設定の取得
export function getAllTokenConfigs() {
  return Object.values(TOKENS).map(getTokenConfig);
}

// 主要トークン設定の取得
export function getPrimaryTokenConfigs() {
  return PRIMARY_TOKENS.map(getTokenConfig);
}

// 特定のトークン設定の取得（存在チェック付き）
export function getTokenConfigSafe(tokenName: string) {
  if (Object.values(TOKENS).includes(tokenName as TokenName)) {
    return getTokenConfig(tokenName as TokenName);
  }
  return null;
}
