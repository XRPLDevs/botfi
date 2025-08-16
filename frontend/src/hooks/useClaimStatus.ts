'use client';

import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';
import type { ClaimStatusResponse } from '@/app/(app)/_containers/asset-table/types';

export function useClaimStatus() {
  const { account, isConnected } = useWallet();

  return useQuery({
    queryKey: ['claim-status', account?.address],
    queryFn: async () => {
      if (!isConnected || !account || !account.jwt) {
        throw new Error('Wallet not connected');
      }

      const jwt = account.jwt;

      const response = await fetch('/api/claim-status', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch claim status');
      }

      const data: ClaimStatusResponse[] = await response.json();
      return data;
    },
    enabled: isConnected && !!account?.jwt,
  });
}
