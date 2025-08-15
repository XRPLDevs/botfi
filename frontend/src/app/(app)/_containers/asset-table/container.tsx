'use client';

import { ASSET_CONFIG } from '@/app/(app)/_lib/asset-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { TrustlineChecker } from '../client/trustline-checker';
import { AssetTableHeader, AssetTableView } from './presentational';
import type { TrustlineStatus } from './types';

// テーブルのローディング用Skeleton（Tableコンポーネントと同じ構造）
function AssetTableSkeleton() {
  return (
    <Table>
      <AssetTableHeader />
      <TableBody>
        {ASSET_CONFIG.map((asset) => (
          <TableRow key={asset.currency}>
            <TableCell className="w-[100px]">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{asset.currency}</span>
              </div>
            </TableCell>
            <TableCell className="w-[200px]">
              <p className="font-bold">{asset.currency}</p>
              {asset.issuer && <p className="text-xs text-gray-500 break-all">{asset.issuer}</p>}
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
      {(trustlineStatus, isLoading, error) => {
        // ローディング中またはデータが未取得の場合はSkeletonを表示
        if (isLoading || !trustlineStatus) {
          return <AssetTableSkeleton />;
        }

        const assets = ASSET_CONFIG.map((asset) => ({
          id: asset.currency,
          type: asset.currency as 'BOT' | 'PRO' | 'RLUSD',
          issuer: asset.issuer,
          balance: 0,
          hasTrustline: trustlineStatus[asset.currency as keyof TrustlineStatus] || false,
        }));

        return (
          <AssetTableView
            assets={assets}
            trustlineStatus={trustlineStatus}
            isLoading={isLoading}
            error={error}
          />
        );
      }}
    </TrustlineChecker>
  );
}
