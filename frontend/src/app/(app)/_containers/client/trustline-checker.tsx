'use client';

import type {
  TrustlineResponse,
  TrustlineStatus,
  TrustlineStatusWithBalance,
} from '@/app/(app)/_containers/asset-table/types';
import { useTrustline } from '@/hooks/useTrustline';
import { getPrimaryTokenConfigs } from '@/lib/constants';

type TrustlineCheckerProps = {
  children: (
    trustlineStatus: TrustlineStatus | null,
    trustlineStatusWithBalance: TrustlineStatusWithBalance | null,
    isLoading: boolean,
    error: string | null
  ) => React.ReactNode;
};

export function TrustlineChecker({ children }: TrustlineCheckerProps) {
  const { data, isLoading, error } = useTrustline();

  // APIレスポンスの配列データをTrustlineStatusオブジェクトに変換
  const trustlineStatus: TrustlineStatus | null = data
    ? (() => {
        const status: TrustlineStatus = {} as TrustlineStatus;
        const primaryTokens = getPrimaryTokenConfigs();

        // 各主要トークンのtrustline状態を設定
        primaryTokens.forEach(({ currency }) => {
          const trustline = data.find((t: TrustlineResponse) => t.displayCurrency === currency);
          status[currency] = trustline?.isTrust || false;
        });

        return status;
      })()
    : null;

  // 残高情報も含むTrustlineStatusWithBalanceを生成
  const trustlineStatusWithBalance: TrustlineStatusWithBalance | null = data
    ? (() => {
        const status: TrustlineStatusWithBalance = {} as TrustlineStatusWithBalance;
        const primaryTokens = getPrimaryTokenConfigs();

        primaryTokens.forEach(({ currency }) => {
          const trustline = data.find((t: TrustlineResponse) => t.displayCurrency === currency);
          status[currency] = {
            hasTrustline: trustline?.isTrust || false,
            balance: parseFloat(trustline?.balance || '0'),
          };
        });

        return status;
      })()
    : null;

  return (
    <>{children(trustlineStatus, trustlineStatusWithBalance, isLoading, error?.message || null)}</>
  );
}
