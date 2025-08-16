import { NETWORKS } from './networks';
import { TOKENS } from './tokens';
import { CONSTRAINTS } from './common';

/**
 * Common function to validate configuration integrity
 */
export function validateConfiguration() {
  const errors: string[] = [];

  // Token configuration validation
  Object.values(TOKENS).forEach((tokenName) => {
    if (!tokenName || tokenName.trim() === '') {
      errors.push(`Invalid token name: ${tokenName}`);
    }
  });

  // Network configuration validation
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
