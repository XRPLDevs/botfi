'use client';

import type { TrustlineStatus } from '@/app/(app)/_containers/asset-table/types';
import { useTrustline } from '@/hooks/useTrustline';

type TrustlineCheckerProps = {
  children: (
    trustlineStatus: TrustlineStatus | null,
    isLoading: boolean,
    error: string | null
  ) => React.ReactNode;
};

export function TrustlineChecker({ children }: TrustlineCheckerProps) {
  const { data, isLoading, error } = useTrustline();

  // データが取得されるまでnullを渡す
  const trustlineStatus = data || null;

  return <>{children(trustlineStatus, isLoading, error?.message || null)}</>;
}
