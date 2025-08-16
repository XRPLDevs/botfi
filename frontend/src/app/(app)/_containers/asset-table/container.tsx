'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import type { TokenName } from '@/lib/constants';
import { PRIMARY_TOKENS, getTokenConfig } from '@/lib/constants';
import { TrustlineChecker } from '../client/trustline-checker';
import { DialogsContainer } from './dialogs/container';
import { AssetTableHeader, AssetTableView } from './presentational';

// アドレスを省略表記にするヘルパー関数
function formatAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

// テーブルのローディング用Skeleton（Tableコンポーネントと同じ構造）
function AssetTableSkeleton() {
  return (
    <Table>
      <AssetTableHeader />
      <TableBody>
        {PRIMARY_TOKENS.map((tokenName) => {
          const config = getTokenConfig(tokenName);
          return (
            <TableRow key={tokenName}>
              <TableCell className="w-[100px]">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{tokenName}</span>
                </div>
              </TableCell>
              <TableCell className="w-[200px]">
                <p className="text-bold">{tokenName}</p>
                {config.issuer && (
                  <p className="text-xs text-muted-foreground break-all">
                    {formatAddress(config.issuer)}
                  </p>
                )}
              </TableCell>
              <TableCell className="w-[100px]">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="w-[120px]">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="text-right w-[200px]">
                <Skeleton className="h-8 w-24 ml-auto" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function AssetTableContainer() {
  return (
    <TrustlineChecker>
      {(trustlineStatus, trustlineStatusWithBalance, claimStatus, isLoading, error) => {
        // ローディング中またはデータが未取得の場合はSkeletonを表示
        if (isLoading || !trustlineStatus || !trustlineStatusWithBalance) {
          return <AssetTableSkeleton />;
        }

        // 実際のデータ表示時
        const assets = PRIMARY_TOKENS.map((tokenName) => {
          const config = getTokenConfig(tokenName);
          const trustlineInfo = trustlineStatusWithBalance[tokenName];
          return {
            id: tokenName,
            type: tokenName,
            issuer: config.issuer,
            balance: trustlineInfo?.balance || 0,
            hasTrustline: trustlineInfo?.hasTrustline || false,
          };
        });

        return (
          <DialogsContainer claimStatus={claimStatus}>
            {(openDialog) => (
              <AssetTableView
                assets={assets}
                trustlineStatus={trustlineStatus}
                claimStatus={claimStatus}
                isLoading={isLoading}
                error={error}
                onOpenDialog={openDialog}
              />
            )}
          </DialogsContainer>
        );
      }}
    </TrustlineChecker>
  );
}
