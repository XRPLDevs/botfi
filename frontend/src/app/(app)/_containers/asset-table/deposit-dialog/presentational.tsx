import { memo } from 'react';
import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import type { AssetInfo, TransactionInput } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type DepositDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetInfo | null;
  input: TransactionInput;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export const DepositDialog = memo(({
  isOpen,
  onClose,
  asset,
  input,
  onInputChange,
  onConfirm,
  isLoading = false,
}: DepositDialogProps) => {
  if (!asset) return null;

  // 制約値の計算（仕様書準拠）
  const brlusdTrustlineLimit = 1000; // 仮の値、実際はAPIから取得
  const rlusdBalance = asset.balance;
  const maxDepositAmount = Math.min(brlusdTrustlineLimit, rlusdBalance);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Deposit {asset.type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 制約情報の表示（仕様書要件） */}
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              Deposit制約
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <ul className="list-inside list-disc text-sm">
                <li>bRLUSD Trustline Limit: {brlusdTrustlineLimit.toLocaleString()}</li>
                <li>{asset.type} 残高: {rlusdBalance.toLocaleString()}</li>
                <li>最大Deposit可能額: {maxDepositAmount.toLocaleString()}</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 価格レート情報（仕様書要件：1 RLUSD = 1 bRLUSD） */}
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">
              価格レート
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              <p>1 {asset.type} = 1 bRLUSD（固定レート）</p>
            </AlertDescription>
          </Alert>

          {/* 入力フィールド */}
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit金額</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={input.amount}
                onChange={(e) => onInputChange(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {asset.type}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              最大: {maxDepositAmount.toLocaleString()} {asset.type}
            </div>
          </div>

          {/* 確認情報 */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Deposit金額:</span>
              <span>{input.amount || '0'} {asset.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>受け取るbRLUSD:</span>
              <span>{input.amount || '0'} bRLUSD</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            キャンセル
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading || !input.amount || parseFloat(input.amount) <= 0 || parseFloat(input.amount) > maxDepositAmount}
          >
            {isLoading ? '処理中...' : 'Deposit実行'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

DepositDialog.displayName = 'DepositDialog';
