'use client';

import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
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
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
    const { account, isConnected } = useWalletStore();

    if (!asset || !claimStatus) return null;

    // クールダウン期間の計算（5秒）
    const COOLDOWN_DURATION = 5000; // 5秒
    const isInCooldown = cooldownEnd && new Date() < cooldownEnd;
    const isDisabled = isLoading || isProcessing || isInCooldown || !claimStatus.canClaim || parseFloat(claimStatus.claimableAmount) <= 0;

    // 外側クリック時の動作を制御
    const handleOpenChange = (open: boolean) => {
      // 外側クリックで閉じることを防ぐ
      if (!open) {
        // 明示的にonCloseが呼ばれた場合のみ閉じる
        return;
      }
    };

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
        
        // Claim可能なdepositのみを対象にする
        const claimableDeposits = claimStatus.depositHistory.filter(deposit => !deposit.isClaimed);
        
        if (claimableDeposits.length === 0) {
          toast.error('Claim可能なdepositがありません');
          return;
        }
        
        // UUIDとuserAddressのみを送信（他の情報はAPI側でXRPLから取得）
        claimableDeposits.forEach((deposit, index) => {
          formData.append(`deposits[${index}].uuid`, deposit.uuid);
          formData.append(`deposits[${index}].userAddress`, account.address || '');
        });

        // useTrustline.tsと同様に、AuthorizationヘッダーでJWTトークンを送信
        const response = await fetch('/api/claim', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.jwt}`,
          },
          body: formData,
        });

        const result = await response.json();


        if (result.ok) {
          // 成功時の処理
          if (result.successfulClaims > 0) {
            toast.success(
              `Claim transactions completed successfully! ${result.successfulClaims}/${result.totalDeposits} transactions succeeded.`
            );
            
            // クールダウン期間を設定
            const cooldownEndTime = new Date(Date.now() + COOLDOWN_DURATION);
            setCooldownEnd(cooldownEndTime);
            
            // Claim完了後のデータ再取得
            queryClient.invalidateQueries({ queryKey: ['claim-status', account?.address] });
            
            onClose();
          } else {
            toast.error('All claim transactions failed');
          }
        } else {
          // エラーメッセージの詳細化
          let errorMessage = result.error || 'Failed to create claim transaction';
          
          // 特定のエラーケースの処理
          if (result.error === 'Claim is already being processed') {
            errorMessage = 'Claimは既に処理中です。しばらくお待ちください。';
          } else if (result.error === 'Invalid input data') {
            errorMessage = '入力データが不正です。UUIDまたはユーザーアドレスを確認してください。';
          } else if (result.error === 'Already minted') {
            errorMessage = 'このdepositは既にClaim済みです。Claim可能なdepositを選択してください。';
            // Claim済みの場合はデータを再取得
            queryClient.invalidateQueries({ queryKey: ['claim-status', account?.address] });
            // ダイアログを閉じて最新の状態を表示
            onClose();
          } else if (result.error === 'Deposit transaction not found or invalid memo structure') {
            errorMessage = 'Depositトランザクションが見つからないか、メモ構造が不正です。';
          } else if (result.error === 'Address mismatch with original deposit') {
            errorMessage = 'アドレスが元のdepositと一致しません。';
          } else if (result.error === 'Invalid amount structure in deposit transaction') {
            errorMessage = 'Depositトランザクションの金額構造が不正です。';
          } else if (result.error === 'Invalid currency or issuer') {
            errorMessage = '通貨または発行者が不正です。';
          } else if (result.error === 'Path could not send partial amount - insufficient liquidity') {
            errorMessage = '送金経路が見つかりません。流動性が不足している可能性があります。';
          } else if (result.error === 'Insufficient funds for payment') {
            errorMessage = '支払いのための資金が不足しています。';
          } else if (result.error === 'No trustline exists') {
            errorMessage = 'トラストラインが存在しません。';
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
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-lg" showCloseButton={false}>
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
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
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

            {/* Claimable Deposit履歴の表示 */}
            {claimStatus?.depositHistory && claimStatus.depositHistory.length > 0 && (
              <Alert className="bg-muted border-border">
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                <AlertTitle className="text-foreground">Claimable Deposit履歴</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  <p className="text-sm text-muted-foreground mb-3">
                    この{asset.type}のClaim可能なdeposit履歴を表示しています
                  </p>
                  <div className="space-y-3 max-h-40 overflow-y-auto w-full pt-2">
                    {claimStatus.depositHistory
                      .filter((deposit) => !deposit.isClaimed) // Claimableなdepositのみ表示
                      .map((deposit, index) => (
                        <div key={index} className="border border-border rounded-lg p-3 bg-background">
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-muted-foreground">UUID:</span>
                                <span className="font-monospace text-xs break-words text-muted-foreground">{deposit.uuid}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-muted-foreground">Tx Hash:</span>
                                <div className="flex items-center space-x-2">
                                  <span className="font-monospace text-xs text-muted-foreground max-w-52 break-words" title={deposit.txHash}>
                                    {deposit.txHash ? `${deposit.txHash.slice(0, 16)}...${deposit.txHash.slice(-16)}` : 'N/A'}
                                  </span>
                                  {deposit.txHash && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(deposit.txHash);
                                          toast.success('Tx Hash copied to clipboard!');
                                        } catch (error) {
                                          toast.error('Failed to copy Tx Hash');
                                        }
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                                      title="Copy full hash"
                                    >
                                      Copy
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-muted-foreground">
                                  Deposited
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(deposit.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-muted-foreground">Amount:</span>
                                <span className="font-semibold text-foreground">{deposit.amount} {asset.type}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {claimStatus.depositHistory.filter((deposit) => deposit.isClaimed).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ※ Claim済みのdepositは表示されていません
                    </p>
                  )}
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
