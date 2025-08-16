import { TOKENS, ISSUERS, DEPOSIT_ADDRESS } from './tokens';

/**
 * 共通の定数と設定値
 */

// デフォルト値
export const DEFAULTS = {
  TRUSTLINE_LIMIT: '1000000000',
  MAX_DECIMALS: 2,
  QUOTE_TTL_SECONDS: 60,
  COOLDOWN_SECONDS: 60,
  MAX_SLIPPAGE_BPS: 100,
} as const;

// 手数料設定
export const FEES = {
  MANAGEMENT_APR_BPS: 50, // 0.5%
  PERFORMANCE_BPS: 300,    // 3%
  MAX_SLIPPAGE_BPS: 100,  // 1%
} as const;

// 制約値
export const CONSTRAINTS = {
  BRLUSD_TRUSTLINE_LIMIT: 1000,
  MAX_POSITION_XRP_PCT: 80,
  MIN_VOLUME_USD: 1000,
} as const;

// メッセージ
export const MESSAGES = {
  WALLET_NOT_CONNECTED: 'ウォレットが接続されていません',
  INVALID_INPUT: '入力値が無効です',
  PROCESSING: '処理中...',
  SUCCESS: '処理が完了しました',
  ERROR: 'エラーが発生しました',
} as const;

// エラーコード
export const ERROR_CODES = {
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  INVALID_INPUT: 'INVALID_INPUT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRUSTLINE_NOT_SET: 'TRUSTLINE_NOT_SET',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// 設定の取得関数
export function getCommonConfig() {
  return {
    tokens: TOKENS,
    issuers: ISSUERS,
    depositAddress: DEPOSIT_ADDRESS,
    defaults: DEFAULTS,
    fees: FEES,
    constraints: CONSTRAINTS,
    messages: MESSAGES,
    errorCodes: ERROR_CODES,
  };
}

// 設定の検証
export function validateCommonConfig() {
  const errors: string[] = [];

  // 必須定数の存在チェック
  if (!DEPOSIT_ADDRESS) {
    errors.push('Deposit address is not configured');
  }

  if (!Object.keys(ISSUERS).length) {
    errors.push('No issuers configured');
  }

  if (!Object.keys(TOKENS).length) {
    errors.push('No tokens configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
