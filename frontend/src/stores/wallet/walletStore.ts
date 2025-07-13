import { create } from 'zustand'

export type WalletState = {
  isConnected: boolean;
  address: string;
}

export type WalletActions = {
  connect: (address: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState & WalletActions>((set, get) => ({
  isConnected: false,
  address: '',

  connect: (address: string) => {
    set({ isConnected: true, address });
  },

  disconnect: () => {
    set({ isConnected: false, address: '' });
  }
}))