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
  if (isTokenExists(tokenName)) {
    return getTokenConfig(tokenName);
  }
  return null;
}

// トークン名変更時の影響範囲を最小化するユーティリティ関数

/**
 * トークン名を変更する際のヘルパー関数
 * 新しいトークン名を設定し、関連する定数を自動更新
 */
export function updateTokenName(oldTokenKey: keyof typeof TOKENS, newTokenName: string) {
  // この関数は開発時のみ使用し、本番環境では定数を直接編集
  console.warn(
    `Token name update: ${oldTokenKey} -> ${newTokenName}. ` +
      'Please update the constants file directly for production use.'
  );

  return {
    oldName: TOKENS[oldTokenKey],
    newName: newTokenName,
    affectedConstants: ['TOKENS', 'ISSUERS', 'DISPLAY_NAMES', 'DESCRIPTIONS', 'PRIMARY_TOKENS'],
  };
}

/**
 * トークンの存在確認
 */
export function isTokenExists(tokenName: string): tokenName is TokenName {
  return Object.values(TOKENS).includes(tokenName as TokenName);
}

/**
 * トークンの発行者アドレス取得
 */
export function getTokenIssuer(tokenName: TokenName): string {
  return ISSUERS[tokenName];
}

/**
 * 主要トークンかどうかの判定
 */
export function isPrimaryToken(tokenName: TokenName): boolean {
  return PRIMARY_TOKENS.includes(tokenName);
}

/**
 * トークン設定の検証
 */
export function validateTokenConfig(tokenName: TokenName): boolean {
  const config = getTokenConfig(tokenName);
  return !!(config.currency && config.issuer && config.displayName && config.description);
}

/**
 * 全トークン設定の検証
 */
export function validateAllTokenConfigs(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.values(TOKENS).forEach((tokenName) => {
    if (!validateTokenConfig(tokenName)) {
      errors.push(`Invalid configuration for token: ${tokenName}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
