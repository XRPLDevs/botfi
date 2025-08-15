'use client';

import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import { memo, useState } from 'react';
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
import { toast } from '@/components/ui/toaster';
import { useWalletStore } from '@/stores/wallet.store';
import type { AssetInfo, TransactionInput } from '../types';

// Deposit専用アドレス（定数として定義）
const DEPOSIT_DESTINATION_ADDRESS = 'rf9yPn8HtzHTrTB1TyiWzQZtwHA6Huve4x';

type DepositDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetInfo | null;
  input: TransactionInput;
  onInputChange: (value: string) => void;
  isLoading?: boolean;
};

export const DepositDialog = memo(
  ({ isOpen, onClose, asset, input, onInputChange, isLoading = false }: DepositDialogProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { account, isConnected } = useWalletStore();

    if (!asset) return null;

    // 制約値の計算（仕様書準拠）
    const brlusdTrustlineLimit = 1000; // 仮の値、実際はAPIから取得
    const rlusdBalance = asset.balance;
    const maxDepositAmount = Math.min(brlusdTrustlineLimit, rlusdBalance);

    // 小数点第二位までの入力値かどうかを検証する関数
    const isValidDecimalInput = (value: string): boolean => {
      if (!value) return true; // 空文字は許可

      // 数値形式のチェック
      const numberRegex = /^\d+(\.\d{0,2})?$/;
      if (!numberRegex.test(value)) return false;

      // 小数点以下2桁までのチェック
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) return false;
      }

      return true;
    };

    const handleDeposit = async () => {
      if (!asset.issuer) {
        toast.error('Issuer information is required for deposit');
        return;
      }

      if (!isConnected || !account?.jwt) {
        toast.error('Please connect your wallet first');
        return;
      }

      // 小数点第二位までの入力値検証
      if (!isValidDecimalInput(input.amount)) {
        toast.error('Deposit金額は小数点第二位まで入力してください');
        return;
      }

      setIsProcessing(true);

      try {
        // FormDataを作成してServer Actionを呼び出し
        const formData = new FormData();
        formData.append('currency', asset.type);
        formData.append('issuer', asset.issuer);
        formData.append('amount', input.amount);
        formData.append('destination', DEPOSIT_DESTINATION_ADDRESS);

        // useTrustline.tsと同様に、AuthorizationヘッダーでJWTトークンを送信
        const response = await fetch('/api/deposit', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.jwt}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (result.ok && result.signUrl) {
          // 成功時は署名用URLを新しいタブで開く
          window.open(result.signUrl, '_blank');
          toast.success(
            `Deposit transaction created for ${asset.type}. Please sign the transaction in the new tab.`
          );
          onClose();
        } else {
          toast.error(result.error || 'Failed to create deposit transaction');
        }
      } catch (_error) {
        toast.error('An error occurred while processing the deposit');
      } finally {
        setIsProcessing(false);
      }
    };

    // ウォレットが接続されていない場合の警告
    if (!isConnected) {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Wallet Not Connected</DialogTitle>
            </DialogHeader>
            <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-200">
                Connection Required
              </AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                Please connect your wallet first to perform deposit operations.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Deposit {asset.type}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 制約情報の表示（仕様書要件） */}
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">Deposit制約</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <ul className="list-inside list-disc text-sm">
                  <li>bRLUSD Trustline Limit: {brlusdTrustlineLimit.toLocaleString()}</li>
                  <li>
                    {asset.type} 残高: {rlusdBalance.toLocaleString()}
                  </li>
                  <li>最大Deposit可能額: {maxDepositAmount.toLocaleString()}</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* 価格レート情報（仕様書要件：1 RLUSD = 1 bRLUSD） */}
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">価格レート</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <p>1 {asset.type} = 1 bRLUSD（固定レート）</p>
              </AlertDescription>
            </Alert>

            {/* Deposit専用アドレス情報 */}
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <InfoIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Deposit専用アドレス
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <p className="font-mono text-sm break-all">{DEPOSIT_DESTINATION_ADDRESS}</p>
                <p className="text-xs mt-1">このアドレスへ{asset.type}を送金します</p>
              </AlertDescription>
            </Alert>

            {/* 入力フィールド */}
            <div className="space-y-2">
              <Label htmlFor="amount">Deposit金額</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={input.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 小数点第二位までしか入力できないように制限
                    if (isValidDecimalInput(value)) {
                      onInputChange(value);
                    }
                  }}
                  className="pr-20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {asset.type}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                最大: {maxDepositAmount.toLocaleString()} {asset.type}（小数点第二位まで）
              </div>
            </div>

            {/* 確認情報 */}
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deposit金額:</span>
                <span>
                  {input.amount || '0'} {asset.type}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>受け取るbRLUSD:</span>
                <span>{input.amount || '0'} bRLUSD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>送金先:</span>
                <span className="font-mono text-xs">
                  {DEPOSIT_DESTINATION_ADDRESS.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading || isProcessing}>
              キャンセル
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={
                isLoading ||
                isProcessing ||
                !input.amount ||
                parseFloat(input.amount) <= 0 ||
                parseFloat(input.amount) > maxDepositAmount
              }
            >
              {isProcessing ? '処理中...' : 'Deposit実行'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

DepositDialog.displayName = 'DepositDialog';
