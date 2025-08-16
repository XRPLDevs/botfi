import {
  TOKENS,
  ISSUERS,
  DEPOSIT_ADDRESS,
  DEPOSIT_WALLET,
  TRUSTLINE_LIMITS,
  DEFAULT_TRUSTLINE_LIMIT,
} from './tokens';

/**
 * Common constants and configuration values
 */

// Constraints
export const CONSTRAINTS = {
  BRLUSD_TRUSTLINE_LIMIT: Number(TRUSTLINE_LIMITS.bRLUSD),
} as const;
