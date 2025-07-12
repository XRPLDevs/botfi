import { NETWORKS } from './networks';
import { TOKENS } from './tokens';
import { DEFAULTS, FEES, CONSTRAINTS } from './common';

/**
 * 設定の整合性を検証する共通関数
 */
export function validateConfiguration() {
  const errors: string[] = [];

  // トークン設定の検証
  Object.values(TOKENS).forEach((tokenName) => {
    if (!tokenName || tokenName.trim() === '') {
      errors.push(`Invalid token name: ${tokenName}`);
    }
  });

  // ネットワーク設定の検証
  Object.values(NETWORKS).forEach((network) => {
    if (!network || network.trim() === '') {
      errors.push(`Invalid network name: ${network}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      tokenCount: Object.keys(TOKENS).length,
      networkCount: Object.keys(NETWORKS).length,
    },
  };
}
