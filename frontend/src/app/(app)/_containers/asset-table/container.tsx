'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import type { TokenName } from '@/lib/constants';
import { getPrimaryTokenConfigs } from '@/lib/constants';
import { TrustlineChecker } from '../client/trustline-checker';
import { DialogsContainer } from './dialogs/container';
import { AssetTableHeader, AssetTableView } from './presentational';

// テーブルのローディング用Skeleton（Tableコンポーネントと同じ構造）
function AssetTableSkeleton() {
  return (
    <Table>
      <AssetTableHeader />
      <TableBody>
        {getPrimaryTokenConfigs().map((asset: { currency: TokenName; issuer: string }) => (
          <TableRow key={asset.currency}>
            <TableCell className="w-[100px]">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{asset.currency}</span>
              </div>
            </TableCell>
            <TableCell className="w-[200px]">
              <p className="text-bold">{asset.currency}</p>
              {asset.issuer && (
                <p className="text-xs text-muted-foreground break-all">{asset.issuer}</p>
              )}
            </TableCell>
            <TableCell className="w-[100px]">
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="text-right w-[200px]">
              <Skeleton className="h-8 w-24 ml-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AssetTableContainer() {
  return (
    <TrustlineChecker>
      {(trustlineStatus, trustlineStatusWithBalance, isLoading, error) => {
        // ローディング中またはデータが未取得の場合はSkeletonを表示
        if (isLoading || !trustlineStatus || !trustlineStatusWithBalance) {
          return <AssetTableSkeleton />;
        }

        const assets = getPrimaryTokenConfigs().map(
          (asset: { currency: TokenName; issuer: string }) => {
            const trustlineInfo = trustlineStatusWithBalance[asset.currency];
            return {
              id: asset.currency,
              type: asset.currency,
              issuer: asset.issuer,
              balance: trustlineInfo?.balance || 0,
              hasTrustline: trustlineInfo?.hasTrustline || false,
            };
          }
        );

        return (
          <DialogsContainer>
            {(openDialog) => (
              <AssetTableView
                assets={assets}
                trustlineStatus={trustlineStatus}
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
