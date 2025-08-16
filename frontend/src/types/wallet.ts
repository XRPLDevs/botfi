export enum WalletConnectionStates {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export type WalletConnectionState =
  (typeof WalletConnectionStates)[keyof typeof WalletConnectionStates];

export enum WalletTypes {
  XAMAN = 'xaman',
}

export type WalletType = (typeof WalletTypes)[keyof typeof WalletTypes];

export enum NetworkTypes {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
}

export type NetworkType = (typeof NetworkTypes)[keyof typeof NetworkTypes];

export enum ErrorCodes {
  CONNECTION_FAILED = 'connection_failed',
}

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export type WalletInfo = {
  jwt: string | null;
  address: string;
  network: NetworkType;
  walletType: WalletType;
};

export type WalletError = {
  code: ErrorCode;
  message: string;
};

export type WalletDisplayInfo = {
  name: string;
  logo: string;
};

export const WALLET_CONFIGS: Record<WalletTypes, WalletDisplayInfo> = {
  [WalletTypes.XAMAN]: {
    name: 'Xaman',
    logo: '/xaman_logo.svg',
  },
} as const;
