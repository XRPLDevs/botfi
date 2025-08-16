import { AlertTriangleIcon, CreditCardIcon, InfoIcon } from 'lucide-react';
import { memo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AssetInfo, TransactionInput } from '../types';

type WithdrawDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetInfo | null;
  input: TransactionInput;
  onInputChange: (value: string) => void;
  isLoading?: boolean;
};

export const WithdrawDialog = memo(
  ({ isOpen, onClose, asset, input, onInputChange, isLoading = false }: WithdrawDialogProps) => {
    if (!asset) return null;

    // 最大Withdraw可能額（現在の残高）
    const maxWithdrawAmount = asset.balance;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Withdraw {asset.type}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 償還方式の説明（仕様書要件） */}
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <InfoIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">償還方式</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <ul className="list-inside list-disc text-sm">
                  <li>既定: IN_KIND（USDT + XRP按分）</li>
                  <li>オプション: USDT単独返却</li>
                  <li>スリッページ管理: TWAP参照</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* 手数料情報（仕様書要件） */}
            <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
              <CreditCardIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <AlertTitle className="text-purple-800 dark:text-purple-200">手数料体系</AlertTitle>
              <AlertDescription className="text-purple-700 dark:text-purple-300">
                <ul className="list-inside list-disc text-sm">
                  <li>管理手数料: 0.5% APR</li>
                  <li>成功報酬: 3% (HWM方式)</li>
                  <li>最大スリッページ: 1%</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* 入力フィールド */}
            <div className="space-y-2">
              <Label htmlFor="amount">Withdraw金額</Label>
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
                最大: {maxWithdrawAmount.toLocaleString()} {asset.type}
              </div>
            </div>

            {/* 確認情報 */}
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Withdraw金額:</span>
                <span>
                  {input.amount || '0'} {asset.type}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>償還方式:</span>
                <span>IN_KIND（推奨）</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>手数料:</span>
                <span>約 0.5%</span>
              </div>
            </div>

            {/* 注意事項 */}
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">注意事項</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <ul className="list-inside list-disc text-sm">
                  <li>Quote有効期限: 60秒</li>
                  <li>スリッページ制限: 1%以内</li>
                  <li>クールダウン期間: 60秒</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              キャンセル
            </Button>
            <Button
              onClick={onClose}
              disabled={
                isLoading ||
                !input.amount ||
                parseFloat(input.amount) <= 0 ||
                parseFloat(input.amount) > maxWithdrawAmount
              }
            >
              {isLoading ? '処理中...' : 'Withdraw実行'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

WithdrawDialog.displayName = 'WithdrawDialog';
