/**
 * 統一されたメッセージ定数
 * すべて英語で統一
 */

// エラーメッセージ
export const ERROR_MESSAGES = {
  // バリデーションエラー
  VALIDATION: {
    INVALID_AMOUNT: 'Please enter a valid amount',
    AMOUNT_REQUIRED: 'Please enter the deposit amount',
    AMOUNT_TOO_HIGH: 'Deposit amount must be 1,000,000 or less',
    WALLET_ADDRESS_REQUIRED: 'Wallet address is required',
    NETWORK_TYPE_REQUIRED: 'Network type is required',
    INVALID_NETWORK_CONFIG: 'Invalid network configuration',
  },
  
  // トランザクションエラー
  TRANSACTION: {
    REJECTED: 'Transaction was rejected',
    DEPOSIT_REJECTED: 'Deposit was rejected',
    GEMWALLET_NOT_INSTALLED: 'GemWallet is not installed',
  },
  
  // システムエラー
  SYSTEM: {
    UNKNOWN_ERROR: 'An unknown error occurred',
    NETWORK_ERROR: 'Network connection or wallet status error',
    TRUSTLINE_SETUP_ERROR: 'Trustline setup error',
    DEPOSIT_FAILED: 'Deposit failed',
  },
} as const

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  DEPOSIT_COMPLETED: (amount: string) => `${amount} RLUSD deposit completed`,
} as const

// UI表示メッセージ
export const UI_MESSAGES = {
  // ウォレット関連
  WALLET: {
    CONNECT_REQUIRED: 'Please connect your wallet',
    CONNECT_DESCRIPTION: 'To use BotFi, you need to connect your wallet first',
    CHECKING_STATUS: 'Checking wallet configuration...',
    PLEASE_WAIT: 'Please wait while we verify your settings',
  },
  
  // Trustline関連
  TRUSTLINE: {
    CHECKING_STATUS: 'Checking Trustline status...',
    NOT_SET: 'Trustline not configured',
    NOT_SET_DESCRIPTION: 'Trustline configuration is required to receive BOT tokens',
    SET_COMPLETED: 'Trustline configured',
    SET_COMPLETED_DESCRIPTION: 'BOT token reception is now allowed. You can start BotFi by depositing RLUSD',
    ALLOW_RECEPTION: 'Allow Reception',
  },
  
  // デポジット関連
  DEPOSIT: {
    AMOUNT_LABEL: 'Deposit Amount',
    PROCESSING: 'Processing...',
    DEPOSIT_RLUSD: 'Deposit RLUSD',
  },
  
  // エラー関連
  ERROR: {
    RETRY: 'Retry',
    STATUS_CHECK_FAILED: 'Failed to get Trustline status',
    STATUS_CHECK_FAILED_DESCRIPTION: 'Please check your network connection or wallet status',
  },
} as const
