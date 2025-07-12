'use client';

import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';
import { useWalletStore } from '@/stores/wallet.store';
import type { AssetInfo, ClaimStatusResponse } from '../types';

type ClaimDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetInfo | null;
  claimStatus: ClaimStatusResponse | null;
  isLoading?: boolean;
};

export const ClaimDialog = memo(
  ({ isOpen, onClose, asset, claimStatus, isLoading = false }: ClaimDialogProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
    const { account, isConnected } = useWalletStore();

    if (!asset || !claimStatus) return null;

    // クールダウン期間の計算（5秒）
    const COOLDOWN_DURATION = 5000; // 5秒
    const isInCooldown = cooldownEnd && new Date() < cooldownEnd;
    const isDisabled = isLoading || isProcessing || isInCooldown || !claimStatus.canClaim || parseFloat(claimStatus.claimableAmount) <= 0;

    const handleClaim = async () => {
      if (isDisabled) return;

      if (!asset.issuer) {
        toast.error('Issuer information is required for claim');
        return;
      }

      if (!isConnected || !account?.jwt) {
        toast.error('Please connect your wallet first');
        return;
      }

      if (!claimStatus.canClaim || parseFloat(claimStatus.claimableAmount) <= 0) {
        toast.error('No claimable amount available');
        return;
      }

      setIsProcessing(true);

      try {
        // FormDataを作成してServer Actionを呼び出し
        const formData = new FormData();
        formData.append('currency', asset.type);
        formData.append('issuer', asset.issuer);
        formData.append('amount', claimStatus.claimableAmount);
        formData.append('uuid', claimStatus.depositHistory[0]?.uuid || ''); // 最初のdepositのUUIDを使用
        formData.append('userAddress', account.address || '');

        // useTrustline.tsと同様に、AuthorizationヘッダーでJWTトークンを送信
        const response = await fetch('/api/claim', {
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
            `Claim transaction created for ${asset.type}. Please sign the transaction in the new tab.`
          );
          
          // クールダウン期間を設定
          const cooldownEndTime = new Date(Date.now() + COOLDOWN_DURATION);
          setCooldownEnd(cooldownEndTime);
          
          onClose();
        } else {
          // エラーメッセージの詳細化
          let errorMessage = result.error || 'Failed to create claim transaction';
          
          // 特定のエラーケースの処理
          if (result.error === 'Claim is already being processed') {
            errorMessage = 'Claimは既に処理中です。しばらくお待ちください。';
          } else if (result.error === 'Invalid input data') {
            errorMessage = '入力データが不正です。currencyまたはissuerを確認してください。';
          }
          
          toast.error(errorMessage);
        }
      } catch (_error) {
        toast.error('An error occurred while processing the claim');
      } finally {
        setIsProcessing(false);
      }
    };

    // クールダウン終了時の処理
    useEffect(() => {
      if (cooldownEnd && new Date() >= cooldownEnd) {
        setCooldownEnd(null);
      }
    }, [cooldownEnd]);

    // クールダウン残り時間の計算
    const getCooldownText = () => {
      if (!cooldownEnd) return '';
      const remaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
      return remaining > 0 ? `${remaining}秒後に再試行可能` : '';
    };

    // ウォレットが接続されていない場合の警告
    if (!isConnected) {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
                  <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center">Wallet Not Connected</DialogTitle>
          </DialogHeader>
            <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-200">
                Connection Required
              </AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                Please connect your wallet first to perform claim operations.
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center">Claim {asset.type}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Claim可能状態の表示 */}
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <InfoIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Claim Status</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <ul className="list-inside list-disc text-sm">
                  <li>Claimable Amount: {claimStatus.claimableAmount} {asset.type}</li>
                  <li>Total Deposited: {claimStatus.totalDeposited} {asset.type}</li>
                  <li>Total Claimed: {claimStatus.totalClaimed} {asset.type}</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Deposit履歴の表示 */}
            {claimStatus.depositHistory.length > 0 && (
              <Alert className="bg-muted border-border">
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                <AlertTitle className="text-foreground">Deposit History</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  <div className="space-y-3 max-h-40 overflow-y-auto w-full pt-2">
                    {claimStatus.depositHistory.map((deposit, index) => (
                      <div key={index} className="border border-border rounded-lg p-3 bg-background">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-muted-foreground">UUID:</span>
                              <span className="font-mono text-xs break-words text-muted-foreground">{deposit.uuid}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-muted-foreground">Amount:</span>
                              <span className="font-semibold text-foreground">{deposit.amount} {asset.type}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={deposit.isClaimed ? 'text-foreground' : 'text-muted-foreground'}>
                                {deposit.isClaimed ? 'Claimed' : 'Claimable'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(deposit.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 確認情報 */}
            <Alert className="bg-muted border-muted">
              <AlertDescription>
                <div className="space-y-4 w-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground">Claim Amount:</span>
                      <span className="font-semibold text-lg">
                        {claimStatus.claimableAmount} {asset.type}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-muted-foreground">From:</span>
                          <span className="font-mono text-sm">{asset.issuer}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-muted-foreground">To:</span>
                          <span className="font-mono text-sm">{account?.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading || isProcessing}>
              キャンセル
            </Button>
            <Button
              onClick={handleClaim}
              disabled={isDisabled}
            >
              {isProcessing ? '処理中...' : 'Claim実行'}
            </Button>
            {isInCooldown && (
              <span className="text-sm text-muted-foreground">{getCooldownText()}</span>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ClaimDialog.displayName = 'ClaimDialog';
