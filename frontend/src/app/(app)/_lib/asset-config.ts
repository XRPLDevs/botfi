import type { AssetType } from '@/app/(app)/_containers/asset-table/types';

export const ASSET_CONFIG = [
  {
    currency: 'BOT',
    issuer: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // 実際のBOT発行者アドレス
    displayName: 'BOT',
    description: 'BOT',
  },
  {
    currency: 'PRO',
    issuer: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // 実際のPRO発行者アドレス
    displayName: 'PRO',
    description: 'PRO',
  },
  {
    currency: 'RLUSD',
    issuer: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
    displayName: 'RLUSD',
    description: 'RLUSD',
  },
] as const;

export const ASSETS: AssetType[] = ['BOT', 'PRO'];
