// ============================================================================
// Token-related constants centralized management
// ============================================================================

// Basic definitions
export const TOKENS = {
  BRLUSD: 'bRLUSD', // BotFi issued stablecoin
  RLUSD: 'RLUSD', // Ripple issued stablecoin
} as const;

export type TokenName = (typeof TOKENS)[keyof typeof TOKENS];

// Issuer and address information
export const ISSUERS = {
  [TOKENS.BRLUSD]: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // BotFi issuer address
  [TOKENS.RLUSD]: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV', // Ripple issuer address
} as const;

export const DEPOSIT_ADDRESS = 'rf9yPn8HtzHTrTB1TyiWzQZtwHA6Huve4x'; // RLUSD receiving address from users
export const DEPOSIT_WALLET = 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC'; // Deposit management wallet

// Currency codes and display information
export const CURRENCY_CODES = {
  [TOKENS.BRLUSD]: '62524C5553440000000000000000000000000000', // bRLUSD (b + RLUSD)
  [TOKENS.RLUSD]: '524C555344000000000000000000000000000000', // RLUSD (RLUSD)
} as const;

export const DISPLAY_CURRENCY_CODES = {
  [TOKENS.BRLUSD]: 'bRLUSD',
  [TOKENS.RLUSD]: 'RLUSD',
} as const;

// Currency pair correspondence (RLUSD ↔ bRLUSD)
export const CURRENCY_PAIRS = {
  [CURRENCY_CODES[TOKENS.RLUSD]]: CURRENCY_CODES[TOKENS.BRLUSD], // RLUSD → bRLUSD
  [CURRENCY_CODES[TOKENS.BRLUSD]]: CURRENCY_CODES[TOKENS.RLUSD], // bRLUSD → RLUSD
} as const;

// Display and description information
export const DISPLAY_NAMES = {
  [TOKENS.BRLUSD]: 'bRLUSD',
  [TOKENS.RLUSD]: 'RLUSD',
} as const;

export const DESCRIPTIONS = {
  [TOKENS.BRLUSD]: 'BotFi issued stablecoin',
  [TOKENS.RLUSD]: 'Ripple issued stablecoin',
} as const;

// Trustline settings
export const TRUSTLINE_LIMITS = {
  [TOKENS.BRLUSD]: '1000000000',
  [TOKENS.RLUSD]: '1000000000',
} as const;

export const DEFAULT_TRUSTLINE_LIMIT = '1000000000';

// Primary tokens array (Trustline setting targets)
export const PRIMARY_TOKENS: readonly TokenName[] = [TOKENS.BRLUSD, TOKENS.RLUSD] as const;

// ============================================================================
// Configuration retrieval functions
// ============================================================================

export function getTokenConfig(tokenName: TokenName) {
  return {
    currency: CURRENCY_CODES[tokenName], // Encoded currency code
    displayCurrency: DISPLAY_CURRENCY_CODES[tokenName], // Decoded currency code
    issuer: ISSUERS[tokenName],
    displayName: DISPLAY_NAMES[tokenName],
    description: DESCRIPTIONS[tokenName],
    trustlineLimit: TRUSTLINE_LIMITS[tokenName], // Trustline Limit
    rawCurrency: tokenName,
  };
}

export const getBRLUSDConfig = () => getTokenConfig(TOKENS.BRLUSD);
export const getRLUSDConfig = () => getTokenConfig(TOKENS.RLUSD);
export const getPrimaryTokenConfigs = () => PRIMARY_TOKENS.map(getTokenConfig);

// ============================================================================
// Utility functions
// ============================================================================

export const isCorrespondingCurrency = (depositCurrency: string, mintCurrency: string): boolean =>
  CURRENCY_PAIRS[depositCurrency as keyof typeof CURRENCY_PAIRS] === mintCurrency;
