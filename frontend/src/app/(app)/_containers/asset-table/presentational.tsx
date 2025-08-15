import { memo } from 'react';
import type { AssetInfo, TrustlineStatus } from './types';
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
  onOpenDialog: (type: 'deposit' | 'withdraw' | 'setTrustline', asset: AssetInfo) => void;
};

// アクション列の表示内容を決定する関数
function getActionContent(
  asset: AssetInfo, 
  trustlineStatus: TrustlineStatus,
  onOpenDialog: (type: 'deposit' | 'withdraw' | 'setTrustline', asset: AssetInfo) => void
) {
  const { type, hasTrustline, balance } = asset;
  
  // bRLUSD通貨の場合
  if (type === 'bRLUSD') {
    if (!hasTrustline) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="cursor-pointer"
          onClick={() => onOpenDialog('setTrustline', asset)}
        >
          Set Trustline
        </Button>
      );
    } else {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="cursor-pointer"
          disabled={balance <= 0}
          onClick={() => onOpenDialog('withdraw', asset)}
        >
          Withdraw
        </Button>
      );
    }
  }
  
  // PRO通貨の場合
  if (type === 'PRO') {
    if (!hasTrustline) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="cursor-pointer"
          onClick={() => onOpenDialog('setTrustline', asset)}
        >
          Set Trustline
        </Button>
      );
    } else {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="cursor-pointer"
          disabled={balance <= 0}
          onClick={() => onOpenDialog('withdraw', asset)}
        >
          Withdraw
        </Button>
      );
    }
  }
  
  // RLUSD通貨の場合
  if (type === 'RLUSD') {
    if (!hasTrustline) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="cursor-pointer"
          onClick={() => onOpenDialog('setTrustline', asset)}
        >
          Set Trustline
        </Button>
      );
    } else {
      // bRLUSDのTrustline状態を確認
      const brlusdHasTrustline = trustlineStatus.bRLUSD || false;
      
      if (!brlusdHasTrustline) {
        return (
          <div className="text-sm text-amber-600 dark:text-amber-400 text-center px-2 py-1">
            bRLUSDのTrustlineを解除してください。
          </div>
        );
      } else {
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="cursor-pointer"
            disabled={balance <= 0}
            onClick={() => onOpenDialog('deposit', asset)}
          >
            Deposit
          </Button>
        );
      }
    }
  }
  
  // その他の通貨の場合
  if (!hasTrustline) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="cursor-pointer"
        onClick={() => onOpenDialog('setTrustline', asset)}
      >
        Set Trustline
      </Button>
    );
  } else {
    return (
      <div className="text-sm text-muted-foreground text-center px-2 py-1">
        Trustline Set
      </div>
    );
  }
}

export const AssetTableView = memo(({ 
  assets, 
  trustlineStatus, 
  isLoading, 
  error, 
  onOpenDialog 
}: AssetTableViewProps) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  if (assets.length === 0) {
    return <div className="text-muted-foreground">No assets found</div>;
  }

  return (
    <Table>
      <AssetTableHeader />
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="w-[100px]">
              {/* 暗号資産のアイコン画像 */}
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{asset.type}</span>
              </div>
            </TableCell>
            <TableCell className="w-[200px]">
              <p className="font-bold">{asset.type}</p>
              {asset.issuer && <p className="text-xs text-muted-foreground break-all">{asset.issuer}</p>}
            </TableCell>
            <TableCell className="w-[100px]">{asset.balance}</TableCell>
            <TableCell className="text-right w-[200px]">
              {getActionContent(asset, trustlineStatus, onOpenDialog)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

AssetTableView.displayName = 'AssetTableView';
