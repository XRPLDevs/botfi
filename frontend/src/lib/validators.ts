/**
 * 共通のバリデーション関数
 */

/**
 * 小数点入力の検証（小数点第二位まで）
 */
export function isValidDecimalInput(value: string, maxDecimals: number = 2): boolean {
  if (!value) return true; // 空文字は許可

  // 数値形式のチェック
  const numberRegex = /^\d+(\.\d+)?$/;
  if (!numberRegex.test(value)) return false;

  // 小数点以下の桁数チェック
  if (value.includes('.')) {
    const parts = value.split('.');
    if (parts[1] && parts[1].length > maxDecimals) return false;
  }

  return true;
}

/**
 * 金額の範囲チェック
 */
export function isValidAmount(value: string, min: number = 0, max?: number): boolean {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  if (numValue < min) return false;
  if (max !== undefined && numValue > max) return false;
  return true;
}

/**
 * 必須項目のチェック
 */
export function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim() !== '';
}

/**
 * アドレスの形式チェック（XRPL形式）
 */
export function isValidXRPLAddress(address: string): boolean {
  const xrplAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/;
  return xrplAddressRegex.test(address);
}

/**
 * 複合バリデーション結果
 */
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * 金額入力の包括的バリデーション
 */
export function validateAmountInput(
  value: string,
  options: {
    min?: number;
    max?: number;
    maxDecimals?: number;
    required?: boolean;
  } = {}
): ValidationResult {
  const { min = 0, max, maxDecimals = 2, required = true } = options;
  const errors: string[] = [];

  // 必須チェック
  if (required && !isRequired(value)) {
    errors.push('金額を入力してください');
  }

  // 小数点形式チェック
  if (value && !isValidDecimalInput(value, maxDecimals)) {
    errors.push(`小数点以下${maxDecimals}桁まで入力してください`);
  }

  // 範囲チェック
  if (value && !isValidAmount(value, min, max)) {
    if (max !== undefined) {
      errors.push(`金額は${min}から${max}の間で入力してください`);
    } else {
      errors.push(`金額は${min}以上で入力してください`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
