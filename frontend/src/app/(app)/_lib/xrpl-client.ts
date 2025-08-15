import { Client } from 'xrpl';
import type { NetworkType } from '@/types/wallet';

// ネットワーク設定
export const NETWORK_CONFIG = {
  mainnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU',
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC',
  },
  testnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // テストネット用のアドレスに変更
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV', // テストネット用のアドレスに変更
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC', // テストネット用のアドレスに変更
  },
  devnet: {
    BOT_ISSUER: 'rUbvHHDLhJkTA1u6XgPKoPGYSVQwrU6jhU', // デブネット用のアドレスに変更
    RLUSD_ISSUER: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV', // デブネット用のアドレスに変更
    DEPOSIT_WALLET: 'rnjyMRQTM2eYJcrjm1hXdfaUY6vhjAk4pC', // デブネット用のアドレスに変更
  },
} as const;

// ネットワークURL設定
export const NETWORK_URLS = {
  mainnet: 'wss://xrplcluster.com/',
  testnet: 'wss://s.altnet.rippletest.net:51233/',
  devnet: 'wss://s.devnet.rippletest.net:51233/',
} as const;
