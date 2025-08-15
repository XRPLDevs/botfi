'use client';

import { RefreshButtonView } from '@/app/(app)/_containers/refresh-button/presentational';
import { useTrustline } from '@/hooks/useTrustline';

export default function RefreshButtonContainer() {
  const { refetch, isFetching } = useTrustline();

  const handleRefresh = async () => {
    await refetch();
  };

  return <RefreshButtonView onRefresh={handleRefresh} isLoading={isFetching} />;
}
