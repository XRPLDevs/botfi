'use client';

import { useCallback, useState } from 'react';
import { DepositDialog } from '@/app/(app)/_containers/asset-table/deposit-dialog/presentational';
import { SetTrustlineDialog } from '@/app/(app)/_containers/asset-table/set-trustline-dialog/presentational';
import { WithdrawDialog } from '@/app/(app)/_containers/asset-table/withdraw-dialog/presentational';
import { ClaimDialog } from '@/app/(app)/_containers/asset-table/claim-dialog/presentational';
import { useWallet } from '@/hooks/useWallet';
import { setTrustline } from '../../../_lib/actions';
import type { AssetInfo, DialogState, TransactionInput, ClaimStatus } from '../types';

type DialogsContainerProps = {
  children: (
    openDialog: (type: 'deposit' | 'withdraw' | 'setTrustline' | 'claim', asset: AssetInfo) => void
  ) => React.ReactNode;
  claimStatus: ClaimStatus | null;
};

export function DialogsContainer({ children, claimStatus }: DialogsContainerProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: null,
    asset: null,
  });

  const [input, setInput] = useState<TransactionInput>({
    amount: '',
    maxAmount: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const { account } = useWallet();

  // ダイアログを開く
  const openDialog = useCallback(
    (type: 'deposit' | 'withdraw' | 'setTrustline' | 'claim', asset: AssetInfo) => {
      setDialogState({
        isOpen: true,
        type,
        asset,
      });

      // 入力値をリセット
      setInput({
        amount: '',
        maxAmount: asset.balance,
      });
    },
    []
  );

  // ダイアログを閉じる
  const closeDialog = useCallback(() => {
    setDialogState({
      isOpen: false,
      type: null,
      asset: null,
    });

    // 入力値をリセット
    setInput({
      amount: '',
      maxAmount: 0,
    });
  }, []);

  // 入力値の変更
  const handleInputChange = useCallback((value: string) => {
    setInput((prev) => ({
      ...prev,
      amount: value,
    }));
  }, []);

  // トラストライン設定の処理
  const handleTrustlineSet = useCallback(
    async (currency: string, issuer: string, limit: string) => {
      if (!account?.jwt) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('currency', currency);
        formData.append('issuer', issuer);
        formData.append('limit', limit);
        formData.append('jwt', account.jwt);

        const result = await setTrustline(null, formData);

        if (!result.ok) {
          throw new Error(result.error || 'Failed to set trustline');
        }

        // 署名用URLが返された場合、別タブで開く
        if (result.signUrl) {
          window.open(result.signUrl, '_blank');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [account?.jwt]
  );

  return (
    <>
      {children(openDialog)}

      {/* Depositダイアログ */}
      {dialogState.type === 'deposit' && (
        <DepositDialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          asset={dialogState.asset}
          input={input}
          onInputChange={handleInputChange}
        />
      )}

      {/* Withdrawダイアログ */}
      {dialogState.type === 'withdraw' && (
        <WithdrawDialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          asset={dialogState.asset}
          input={input}
          onInputChange={handleInputChange}
        />
      )}

      {/* Set Trustlineダイアログ */}
      {dialogState.type === 'setTrustline' && (
        <SetTrustlineDialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          asset={dialogState.asset}
          onTrustlineSet={handleTrustlineSet}
          isLoading={isLoading}
        />
      )}

      {/* Claimダイアログ */}
      {dialogState.type === 'claim' && (
        <ClaimDialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          asset={dialogState.asset}
          claimStatus={dialogState.asset ? claimStatus?.[dialogState.asset.type] || null : null}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
