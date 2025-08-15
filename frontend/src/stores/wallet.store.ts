'use client';

import { Xumm } from 'xumm';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import {
  ErrorCodes,
  NetworkTypes,
  type WalletConnectionState,
  WalletConnectionStates,
  type WalletError,
  type WalletInfo,
  type WalletType,
  WalletTypes,
} from '@/types/wallet';

const xumm = new Xumm(
  '883b3e9d-7a8e-4005-b9a0-70f0c56024b7',
  'ec1c5962-8356-4860-83d5-6a3a1e95f384'
);

export interface WalletState {
  // Wallet status
  status: WalletConnectionState;

  // Wallet info
  account: WalletInfo | null;

  // Connection status
  isConnected: boolean;

  // Error
  error: WalletError | null;

  // Initialization status
  isInitialized: boolean;
}

export interface WalletActions {
  connect: (walletType: WalletType) => void;
  disconnect: () => void;
  reset: () => void;
  setInitialized: () => void;
}

export interface WalletStore extends WalletState, WalletActions {}

const initialState: WalletState = {
  status: WalletConnectionStates.DISCONNECTED,
  account: null,
  isConnected: false,
  error: null,
  isInitialized: false,
};

export const useWalletStore = create<WalletStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      status: WalletConnectionStates.DISCONNECTED,
      account: null,
      isConnected: false,
      error: null,
      isInitialized: false,

      // Set initialization status
      setInitialized: () => set({ isInitialized: true }),

      // Wallet actions
      connect: async (walletType) => {
        set(() => ({
          status: WalletConnectionStates.CONNECTING,
        }));

        try {
          if (walletType === WalletTypes.XAMAN) {
            const response = await xumm.authorize();

            if (response instanceof Error) {
              throw response;
            }

            if (!response) {
              throw new Error('No response from Xumm');
            }

            if (!response.jwt) {
              throw new Error('No JWT from Xumm');
            }

            if (!response.me.sub) {
              throw new Error('No address from Xumm');
            }

            if (!response.me.networkType) {
              throw new Error('No network from Xumm');
            }

            const jwt = response.jwt;
            const address = response.me.sub;

            let network = NetworkTypes.MAINNET;
            switch (response.me.networkType) {
              case 'MAINNET':
                network = NetworkTypes.MAINNET;
                break;
              case 'TESTNET':
                network = NetworkTypes.TESTNET;
                break;
              case 'DEVNET':
                network = NetworkTypes.DEVNET;
                break;
              default:
                throw new Error('Invalid network from Xumm');
            }

            set(() => ({
              status: WalletConnectionStates.CONNECTED,
              account: {
                jwt,
                address,
                network,
                walletType,
              },
              isConnected: true,
            }));
          }
        } catch (error) {
          set(() => ({
            status: WalletConnectionStates.ERROR,
            error: {
              code: ErrorCodes.CONNECTION_FAILED,
              message: 'Failed to connect wallet',
            },
          }));

          throw error;
        }
      },

      // Disconnect wallet
      disconnect: async () => {
        const { account } = get();

        if (account?.walletType === WalletTypes.XAMAN) {
          await xumm.logout();

          localStorage.removeItem('XummPkceJwt');
          localStorage.removeItem('pkce_state');
        }

        set(() => initialState);
      },

      // Reset wallet state
      reset: () => set(initialState),
    })),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        account: state.account,
        isConnected: state.isConnected,
        status: state.status,
      }),
      onRehydrateStorage: () => (state) => {
        // 初期化完了時にフラグを設定
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);
