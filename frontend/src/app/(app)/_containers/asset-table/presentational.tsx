import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AssetInfo, TrustlineStatus, ClaimStatus } from './types';

// Common table header
export function AssetTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">Asset</TableHead>
        <TableHead className="w-[200px]">Cryptocurrency</TableHead>
        <TableHead className="w-[140px]">Balance</TableHead>
        <TableHead className="w-[140px]">Claimable</TableHead>
        <TableHead className="text-right w-[200px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

type AssetTableViewProps = {
  assets: AssetInfo[];
  trustlineStatus: TrustlineStatus;
  claimStatus: ClaimStatus | null;
  isLoading: boolean;
  error: string | null;
  onOpenDialog: (type: 'deposit' | 'withdraw' | 'setTrustline' | 'claim', asset: AssetInfo) => void;
};

// Function to display claimable amount
function getClaimableAmount(asset: AssetInfo, claimStatus: ClaimStatus | null): React.ReactNode {
  const { type } = asset;
  
  // Only display claimable amount for bRLUSD currency
  if (type === 'bRLUSD' && claimStatus?.bRLUSD) {
    const claimInfo = claimStatus.bRLUSD;
    
    if (claimInfo.canClaim && parseFloat(claimInfo.claimableAmount) > 0) {
      return (
        <div className="text-sm">
          <span className="font-medium">
            {claimInfo.claimableAmount}
          </span>
        </div>
      );
    }
  }
  
  // Display "-" for other currencies
  return <div className="text-sm text-muted-foreground">-</div>;
}

// Common button generation function
function createActionButton(
  text: string,
  onClick: () => void,
  disabled: boolean = false,
  variant: 'outline' | 'default' = 'outline'
) {
  return (
    <Button
      variant={variant}
      size="sm"
      className="cursor-pointer"
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </Button>
  );
}

// Function to determine the display content of the action column
function getActionContent(
  asset: AssetInfo,
  trustlineStatus: TrustlineStatus,
  claimStatus: ClaimStatus | null,
  onOpenDialog: (type: 'deposit' | 'withdraw' | 'setTrustline' | 'claim', asset: AssetInfo) => void
) {
  const { type, hasTrustline, balance } = asset;

  // When Trustline is not set
  if (!hasTrustline) {
    return createActionButton('Set Trustline', () => onOpenDialog('setTrustline', asset));
  }

  // Process by currency type
  switch (type) {
    case 'bRLUSD': {
      const canClaim = claimStatus?.bRLUSD?.canClaim || false;
      
      return (
        <div className="flex gap-2 justify-end">
          {canClaim && createActionButton('Claim', () => onOpenDialog('claim', asset))}
          {/* bRLUSDのwithdrawボタンを一時的に非表示 */}
          {/* {createActionButton('Withdraw', () => onOpenDialog('withdraw', asset), balance <= 0)} */}
        </div>
      );
    }

    case 'RLUSD': {
      const brlusdHasTrustline = trustlineStatus.bRLUSD || false;
      if (!brlusdHasTrustline) {
        return (
          <div className="text-sm text-amber-600 dark:text-amber-400 text-center px-2 py-1">
            Please remove bRLUSD Trustline.
          </div>
        );
      }
      return createActionButton('Deposit', () => onOpenDialog('deposit', asset), balance <= 0);
    }

    default:
      return <div className="text-sm text-muted-foreground text-center px-2 py-1">Trustline Set</div>;
  }
}

// Helper function to format address in abbreviated notation
function formatAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export const AssetTableView = memo(
  ({ assets, trustlineStatus, claimStatus, isLoading, error, onOpenDialog }: AssetTableViewProps) => {
    if (error) {
      return <div className="text-destructive">Error: {error}</div>;
    }

    // ローディング中またはデータがない場合は、スケルトンテーブルを表示
    if (isLoading || assets.length === 0) {
      return (
        <Table>
          <AssetTableHeader />
          <TableBody>
            {[1, 2, 3].map((index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell className="w-[100px]">
                  {/* Cryptocurrency icon skeleton */}
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                </TableCell>
                <TableCell className="w-[200px]">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-16" />
                    {/* Issuer address skeleton - abbreviated format (8 chars + ... + 6 chars) */}
                    <div className="flex items-center space-x-1">
                      <div className="h-3 bg-muted rounded animate-pulse w-8" />
                      <div className="h-3 bg-muted rounded animate-pulse w-2" />
                      <div className="h-3 bg-muted rounded animate-pulse w-2" />
                      <div className="h-3 bg-muted rounded animate-pulse w-2" />
                      <div className="h-3 bg-muted rounded animate-pulse w-6" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-[140px]">
                  <div className="h-4 bg-muted rounded animate-pulse w-12" />
                </TableCell>
                <TableCell className="w-[140px]">
                  <div className="h-4 bg-muted rounded animate-pulse w-8" />
                </TableCell>
                <TableCell className="text-right w-[200px]">
                  <div className="h-8 bg-muted rounded animate-pulse w-24 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return (
      <Table>
        <AssetTableHeader />
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="w-[100px]">
                {/* Cryptocurrency icon image */}
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{asset.type}</span>
                </div>
              </TableCell>
              <TableCell className="w-[200px]">
                <p className="font-bold">{asset.type}</p>
                {asset.issuer && (
                  <p className="text-xs text-muted-foreground break-all">{formatAddress(asset.issuer)}</p>
                )}
              </TableCell>
              <TableCell className="w-[140px]">{asset.balance}</TableCell>
              <TableCell className="w-[140px]">
                {getClaimableAmount(asset, claimStatus)}
              </TableCell>
              <TableCell className="text-right w-[200px]">
                {getActionContent(asset, trustlineStatus, claimStatus, onOpenDialog)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
);

AssetTableView.displayName = 'AssetTableView';
