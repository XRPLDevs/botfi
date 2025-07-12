'use client';

import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';

export function useTrustline() {
  const { account, isConnected } = useWallet();

  return useQuery({
    queryKey: ['trustline', account?.address],
    queryFn: async () => {
      if (!isConnected || !account || !account.jwt) {
        throw new Error('Wallet not connected');
      }

      const jwt = account.jwt;

      const response = await fetch('/api/trustlines', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trustlines');
      }

      const data = await response.json();
      return data;
    },
    enabled: isConnected && !!account?.jwt,
  });
}
