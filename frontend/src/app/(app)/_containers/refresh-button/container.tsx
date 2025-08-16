'use client';

import { RefreshButtonView } from '@/app/(app)/_containers/refresh-button/presentational';
import { useTrustline } from '@/hooks/useTrustline';
import { useClaimStatus } from '@/hooks/useClaimStatus';

export default function RefreshButtonContainer() {
  const { refetch: refetchTrustline, isFetching: isTrustlineFetching } = useTrustline();
  const { refetch: refetchClaimStatus, isFetching: isClaimStatusFetching } = useClaimStatus();

  const handleRefresh = async () => {
    await Promise.all([refetchTrustline(), refetchClaimStatus()]);
  };

  const isLoading = isTrustlineFetching || isClaimStatusFetching;
  return <RefreshButtonView onRefresh={handleRefresh} isLoading={isLoading} />;
}
