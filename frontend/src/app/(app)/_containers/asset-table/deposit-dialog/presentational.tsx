'use client';

import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BaseDialog, BaseDialogFooter } from '@/components/ui/base-dialog';
import { AmountInput, ConfirmationInfo } from '@/components/ui/form-fields';
import { useFormDataApiCall } from '@/hooks/useApiCall';
import { DEPOSIT_ADDRESS, CONSTRAINTS, FEES } from '@/lib/constants';
import type { AssetInfo, TransactionInput } from '../types';

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
    const { execute, isLoading: isApiLoading } = useFormDataApiCall({
      successMessage: `Deposit transaction created for ${asset?.type}. Please sign the transaction in the new tab.`,
      onSuccess: (result) => {
        if (result?.signUrl) {
          window.open(result.signUrl, '_blank');
          onClose();
        }
      },
    });

    if (!asset) return null;

    // 制約値の計算（仕様書準拠）
    const brlusdTrustlineLimit = CONSTRAINTS.BRLUSD_TRUSTLINE_LIMIT;
    const rlusdBalance = asset.balance;
    const maxDepositAmount = Math.min(brlusdTrustlineLimit, rlusdBalance);

    const handleDeposit = async () => {
      if (!asset.issuer) return;

      const formData = new FormData();
      formData.append('currency', asset.type);
      formData.append('issuer', asset.issuer);
      formData.append('amount', input.amount);
      formData.append('destination', DEPOSIT_ADDRESS);

      await execute('/api/deposit', formData);
    };

    const isProcessing = isLoading || isApiLoading;
    const isConfirmDisabled = !input.amount || parseFloat(input.amount) <= 0 || parseFloat(input.amount) > maxDepositAmount;

    return (
      <BaseDialog
        isOpen={isOpen}
        onClose={onClose}
        title={`Deposit ${asset.type}`}
        footer={
          <BaseDialogFooter
            onCancel={onClose}
            onConfirm={handleDeposit}
            cancelText="キャンセル"
            confirmText="Deposit実行"
            isLoading={isProcessing}
            isConfirmDisabled={isConfirmDisabled}
          />
        }
      >
        {/* 制約情報の表示（仕様書要件） */}
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Deposit制約</AlertTitle>
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
          <AlertTitle className="text-blue-800 dark:text-blue-200">価格レート</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <p>1 {asset.type} = 1 bRLUSD（固定レート）</p>
          </AlertDescription>
        </Alert>

        {/* Deposit専用アドレス情報 */}
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <InfoIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Deposit専用アドレス</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            <p className="font-mono text-sm break-all">{DEPOSIT_ADDRESS}</p>
            <p className="text-xs mt-1">このアドレスへ{asset.type}を送金します</p>
          </AlertDescription>
        </Alert>

        {/* 入力フィールド */}
        <AmountInput
          id="amount"
          label="Deposit金額"
          value={input.amount}
          onChange={onInputChange}
          placeholder="0.00"
          step="0.01"
          min={0}
          max={maxDepositAmount}
          currency={asset.type}
          helperText={`最大: ${maxDepositAmount.toLocaleString()} ${asset.type}（小数点第二位まで）`}
        />

        {/* 確認情報 */}
        <ConfirmationInfo
          items={[
            { label: 'Deposit金額', value: `${input.amount || '0'} ${asset.type}` },
            { label: '受け取るbRLUSD', value: `${input.amount || '0'} bRLUSD` },
            { label: '送金先', value: `${DEPOSIT_ADDRESS.slice(0, 8)}...` },
          ]}
        />
      </BaseDialog>
    );
  }
);

DepositDialog.displayName = 'DepositDialog';
