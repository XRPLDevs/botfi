import { memo } from 'react';
import type { AssetInfo, TrustlineStatus } from '@/app/(app)/_containers/asset-table/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 共通のテーブルヘッダー
export function AssetTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">資産</TableHead>
        <TableHead className="w-[200px]">暗号資産名</TableHead>
        <TableHead className="w-[100px]">残高</TableHead>
        <TableHead className="text-right w-[200px]">アクション</TableHead>
      </TableRow>
    </TableHeader>
  );
}

type AssetTableViewProps = {
  assets: AssetInfo[];
  trustlineStatus: TrustlineStatus;
  isLoading: boolean;
  error: string | null;
};

export const AssetTableView = memo(({ assets, isLoading, error }: AssetTableViewProps) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (assets.length === 0) {
    return <div className="text-gray-500">No assets found</div>;
  }

  return (
    <Table>
      <AssetTableHeader />
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="w-[100px]">
              {/* 暗号資産のアイコン画像 */}
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{asset.type}</span>
              </div>
            </TableCell>
            <TableCell className="w-[200px]">
              <p className="font-bold">{asset.type}</p>
              {asset.issuer && <p className="text-xs text-gray-500 break-all">{asset.issuer}</p>}
            </TableCell>
            <TableCell className="w-[100px]">{asset.balance}</TableCell>
            <TableCell className="text-right w-[200px]">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled={asset.hasTrustline}
              >
                {asset.hasTrustline ? 'Trustline Set' : 'Set Trustline'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

AssetTableView.displayName = 'AssetTableView';
