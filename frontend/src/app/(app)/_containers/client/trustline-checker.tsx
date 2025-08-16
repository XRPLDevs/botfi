'use client';

import type {
  TrustlineResponse,
  TrustlineStatus,
  TrustlineStatusWithBalance,
  ClaimStatusResponse,
  ClaimStatus,
} from '@/app/(app)/_containers/asset-table/types';
import { useTrustline } from '@/hooks/useTrustline';
import { useClaimStatus } from '@/hooks/useClaimStatus';
import { getPrimaryTokenConfigs } from '@/lib/constants';
import { PRIMARY_TOKENS } from '@/lib/constants';

type TrustlineCheckerProps = {
  children: (
    trustlineStatus: TrustlineStatus | null,
    trustlineStatusWithBalance: TrustlineStatusWithBalance | null,
    claimStatus: ClaimStatus | null,
    isLoading: boolean,
    error: string | null
  ) => React.ReactNode;
};

export function TrustlineChecker({ children }: TrustlineCheckerProps) {
  const { data: trustlineData, isLoading: trustlineLoading, error: trustlineError } = useTrustline();
  const { data: claimData, isLoading: claimLoading, error: claimError } = useClaimStatus();

  // APIレスポンスの配列データをTrustlineStatusオブジェクトに変換
  const trustlineStatus: TrustlineStatus | null = trustlineData
    ? (() => {
        const status: TrustlineStatus = {} as TrustlineStatus;
        // 各主要トークンのtrustline状態を設定
        PRIMARY_TOKENS.forEach((tokenName) => {
          const trustline = trustlineData.find((t: TrustlineResponse) => t.displayCurrency === tokenName);
          status[tokenName] = trustline?.isTrust || false;
        });

        return status;
      })()
    : null;

  // 残高情報も含むTrustlineStatusWithBalanceを生成
  const trustlineStatusWithBalance: TrustlineStatusWithBalance | null = trustlineData
    ? (() => {
        const status: TrustlineStatusWithBalance = {} as TrustlineStatusWithBalance;
        // 残高情報も含むTrustlineStatusWithBalanceを生成
        PRIMARY_TOKENS.forEach((tokenName) => {
          const trustline = trustlineData.find((t: TrustlineResponse) => t.displayCurrency === tokenName);
          status[tokenName] = {
            hasTrustline: trustline?.isTrust || false,
            balance: parseFloat(trustline?.balance || '0'),
          };
        });

        return status;
      })()
    : null;

  // Claim可能状態をClaimStatusオブジェクトに変換
  const claimStatus: ClaimStatus | null = claimData
    ? (() => {
        const status: ClaimStatus = {} as ClaimStatus;
        // 各主要トークンのClaim可能状態を設定
        PRIMARY_TOKENS.forEach((tokenName) => {
          const claimInfo = claimData.find((c: ClaimStatusResponse) => c.currency === tokenName);
          status[tokenName] = claimInfo || null;
        });

        return status;
      })()
    : null;

  // ローディング状態とエラー状態を統合
  const isLoading = trustlineLoading || claimLoading;
  const error = trustlineError || claimError;

  return (
    <>{children(trustlineStatus, trustlineStatusWithBalance, claimStatus, isLoading, error?.message || null)}</>
  );
}
