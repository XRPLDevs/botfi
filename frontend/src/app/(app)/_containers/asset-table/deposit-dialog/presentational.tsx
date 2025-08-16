'use client';

import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BaseDialog, BaseDialogFooter } from '@/components/ui/base-dialog';
import { AmountInput, ConfirmationInfo } from '@/components/ui/form-fields';
import { useFormDataApiCall } from '@/hooks/useApiCall';
import { DEPOSIT_ADDRESS, CONSTRAINTS } from '@/lib/constants';
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

    // Constraint value calculation (specification compliant)
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
            cancelText="Cancel"
            confirmText="Execute Deposit"
            isLoading={isProcessing}
            isConfirmDisabled={isConfirmDisabled}
          />
        }
      >
        {/* Constraint information display (specification requirement) */}
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Deposit Constraints</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <ul className="list-inside list-disc text-sm">
              <li>bRLUSD Trustline Limit: {brlusdTrustlineLimit.toLocaleString()}</li>
              <li>{asset.type} Balance: {rlusdBalance.toLocaleString()}</li>
              <li>Maximum Deposit Amount: {maxDepositAmount.toLocaleString()}</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Price rate information (specification requirement: 1 RLUSD = 1/NAV bRLUSD) */}
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Price Rate</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <p>1 {asset.type} = 1/NAV bRLUSD</p>
            <p className="text-xs text-blue-600">
              NAV = Net Asset Value (Total Vault Assets ÷ Total BOT Issued)
            </p>
          </AlertDescription>
        </Alert>

        {/* Input field */}
        <AmountInput
          id="amount"
          label="Deposit Amount"
          value={input.amount}
          onChange={onInputChange}
          placeholder="0.00"
          step="0.01"
          min={0}
          max={maxDepositAmount}
          currency={asset.type}
          helperText={`Maximum: ${maxDepositAmount.toLocaleString()} ${asset.type} (up to 2 decimal places)`}
        />

        {/* Confirmation information */}
        <ConfirmationInfo
          items={[
            { label: 'Deposit Amount', value: `${input.amount || '0'} ${asset.type}` },
            { label: 'bRLUSD to Receive', value: `${input.amount || '0'} bRLUSD` },
            { label: 'Destination', value: `${DEPOSIT_ADDRESS}` },
          ]}
        />
      </BaseDialog>
    );
  }
);

DepositDialog.displayName = 'DepositDialog';
