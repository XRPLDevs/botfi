import {
  validateJwt,
  createErrorResponse,
  createSuccessResponse,
  ApiLogger,
} from '@/lib/api-utils';
import { env } from '@/lib/env';
import { XRPLClient } from '@/lib/xrplClient';
import { DEPOSIT_ADDRESS, CURRENCY_PAIRS, ISSUERS } from '@/lib/constants';
import { encodeCurrencyCode } from '@/utils/currency';
import { validateMemo, ENCODED_MEMO_TYPE_ID } from '@/utils/memo-validation';
import {
  isTransactionSuccessful,
  validateTokenCurrency,
  extractAmountInfo,
} from '@/lib/transaction-validation';

// 通貨ペアの対応関係をチェックする関数
function isCorrespondingCurrency(depositCurrency: string, mintCurrency: string): boolean {
  return CURRENCY_PAIRS[depositCurrency as keyof typeof CURRENCY_PAIRS] === mintCurrency;
}

// 正しい突合ロジック
function findCorrespondingMint(deposit: any, mintTransactions: any[], logger: ApiLogger) {
  return mintTransactions.find((mintTx: any) => {
    const mintTxJson = mintTx.tx_json;
    const mintMemo = mintTxJson.Memos?.[0]?.Memo;

    // 1. Memoの存在確認
    if (!mintMemo) {
      logger.debug('Mint transaction has no memo', {
        mintTxHash: mintTx.hash,
        depositUuid: deposit.uuid,
      });
      return false;
    }

    // 2. Memoの形式検証
    const mintValidation = validateMemo(mintMemo, ENCODED_MEMO_TYPE_ID, logger);
    if (!mintValidation.isValid) {
      logger.debug('Mint memo validation failed', {
        mintTxHash: mintTx.hash,
        error: mintValidation.error,
      });
      return false;
    }

    // 3. UUIDの一致確認
    if (mintValidation.uuid !== deposit.uuid) {
      logger.debug('UUID mismatch', {
        mintTxHash: mintTx.hash,
        depositUuid: deposit.uuid,
        mintUuid: mintValidation.uuid,
      });
      return false;
    }

    // 4. 通貨ペアの対応関係確認（RLUSD ↔ bRLUSD）
    const mintAmountInfo = extractAmountInfo(mintTx, logger);
    if (!mintAmountInfo) {
      logger.debug('Mint amount info extraction failed', {
        mintTxHash: mintTx.hash,
      });
      return false;
    }

    if (!isCorrespondingCurrency(deposit.currency, mintAmountInfo.currency)) {
      logger.debug('Currency pair mismatch', {
        mintTxHash: mintTx.hash,
        depositCurrency: deposit.currency,
        mintCurrency: mintAmountInfo.currency,
        expectedPair: CURRENCY_PAIRS[deposit.currency as keyof typeof CURRENCY_PAIRS],
      });
      return false;
    }

    // 5. 金額の一致確認（許容誤差内）
    const depositAmount = parseFloat(deposit.amount);
    const mintAmount = parseFloat(mintAmountInfo.value);
    const amountDiff = Math.abs(depositAmount - mintAmount);
    const tolerance = 0.000001; // 6桁の精度

    if (amountDiff > tolerance) {
      logger.debug('Amount mismatch', {
        mintTxHash: mintTx.hash,
        depositAmount: deposit.amount,
        mintAmount: mintAmountInfo.value,
        difference: amountDiff,
      });
      return false;
    }

    logger.debug('Perfect match found', {
      mintTxHash: mintTx.hash,
      depositUuid: deposit.uuid,
      depositCurrency: deposit.currency,
      mintCurrency: mintAmountInfo.currency,
      amount: deposit.amount,
    });

    return true;
  });
}

export async function GET(request: Request, _context: { params: Promise<Record<string, never>> }) {
  const logger = new ApiLogger('Claim Status API');

  try {
    logger.info('Starting request processing');

    // JWT認証
    const jwtValidation = await validateJwt(request, 'Claim Status API');
    if (!jwtValidation.success) {
      logger.warn('JWT validation failed', { error: jwtValidation.error });
      return createErrorResponse(
        'Claim Status API',
        null,
        jwtValidation.status,
        jwtValidation.error
      );
    }

    const { address, jwtData } = jwtValidation;
    logger.info('JWT validation successful', { address });

    // XRPLからトランザクション履歴を取得してClaim可能状態を判定
    const xrplClient = new XRPLClient(); // 環境変数から自動的にネットワークを選択

    // 1. ユーザーの送金履歴を取得（成功したトランザクションのみを取得）
    const userTransactions = await xrplClient.requestAccountTx(address, 200);
    logger.debug('User transactions fetched', { count: userTransactions.length });

    // Depositトランザクションをフィルタリング（成功したPaymentのみを取得）
    const depositTransactions = userTransactions.filter((tx: any) => {
      const txJson = tx.tx_json;
      const isPayment = txJson.TransactionType === 'Payment';
      const isToDepositAddress = txJson.Destination === DEPOSIT_ADDRESS;
      const isSuccessful = isTransactionSuccessful(tx.meta?.TransactionResult);

      logger.debug('Deposit transaction filter check', {
        txHash: tx.hash,
        isPayment,
        isToDepositAddress,
        isSuccessful,
        transactionResult: tx.meta?.TransactionResult,
      });

      return isPayment && isToDepositAddress && isSuccessful;
    });

    logger.debug('Deposit transactions filtered (successful only)', {
      count: depositTransactions.length,
    });

    // 2. 各Depositトランザクションの詳細をログ出力
    depositTransactions.forEach((tx: any, index: number) => {
      const txJson = tx.tx_json;
      const memo = txJson.Memos?.[0]?.Memo;

      logger.debug(`Deposit transaction ${index + 1} details:`, {
        txHash: tx.hash,
        memo: memo,
        memoType: memo?.MemoType,
        memoData: memo?.MemoData,
        destination: txJson.Destination,
        account: txJson.Account,
        transactionResult: tx.meta?.TransactionResult,
        isSuccessful: isTransactionSuccessful(tx.meta?.TransactionResult),
      });
    });

    // 3. 有効なDepositトランザクションを特定（MemoTypeが"id"で正しい形式）
    const validDeposits = [];
    const invalidTransactions = [];

    for (const tx of depositTransactions) {
      const txJson = tx.tx_json;
      const memo = txJson.Memos?.[0]?.Memo;

      if (!memo) {
        logger.debug('Transaction has no memo', { txHash: tx.hash });
        invalidTransactions.push({
          txHash: tx.hash,
          reason: 'No memo found',
        });
        continue;
      }

      // Memoの整合性チェック
      const validation = validateMemo(memo, ENCODED_MEMO_TYPE_ID, logger);
      logger.debug('Memo validation result', {
        txHash: tx.hash,
        validation: validation,
      });

      if (!validation.isValid) {
        logger.debug('Memo validation failed', {
          txHash: tx.hash,
          error: validation.error,
        });
        invalidTransactions.push({
          txHash: tx.hash,
          reason: `Invalid memo: ${validation.error}`,
        });
        continue;
      }

      // 通貨情報の抽出（共通関数を使用）
      const amountInfo = extractAmountInfo(tx, logger);

      if (!amountInfo) {
        logger.debug('Amount info extraction failed', { txHash: tx.hash });
        invalidTransactions.push({
          txHash: tx.hash,
          reason: 'Invalid amount structure',
        });
        continue;
      }

      // 通貨コードとissuerの検証（共通関数を使用）
      const tokenValidation = validateTokenCurrency(amountInfo.currency, amountInfo.issuer, logger);

      if (!tokenValidation.isValid) {
        logger.debug('Token validation failed', {
          txHash: tx.hash,
          currency: amountInfo.currency,
          issuer: amountInfo.issuer,
          error: tokenValidation.error,
        });
        invalidTransactions.push({
          txHash: tx.hash,
          reason: tokenValidation.error || 'Invalid currency or issuer',
        });
        continue;
      }

      // 有効なDepositとして追加
      validDeposits.push({
        txHash: tx.hash,
        uuid: validation.uuid,
        amount: amountInfo.value,
        currency: amountInfo.currency,
        issuer: amountInfo.issuer,
        destination: txJson.Destination,
        account: txJson.Account,
        transactionResult: tx.meta?.TransactionResult,
      });
    }

    logger.debug('Valid deposits identified', { count: validDeposits.length });
    logger.debug('Invalid transactions', {
      count: invalidTransactions.length,
      reasons: invalidTransactions.map((t) => t.reason),
    });

    // 4. bRLUSD Issuerウォレットのmint履歴を取得（成功・失敗問わずすべて取得）
    // 修正: RLUSD Issuerではなく、bRLUSD Issuerからmint履歴を取得
    let mintTransactions: any[] = [];

    // bRLUSD Issuerのmint履歴を取得
    const issuerTransactions = await xrplClient.requestAccountTx(ISSUERS.bRLUSD, 200);
    logger.debug('bRLUSD Issuer transactions fetched', {
      count: issuerTransactions.length,
      issuer: ISSUERS.bRLUSD,
    });

    // Mintトランザクションをフィルタリング（成功・失敗問わずすべて取得）
    mintTransactions = issuerTransactions.filter((tx: any) => {
      const txJson = tx.tx_json;
      const isPayment = txJson.TransactionType === 'Payment';
      const isToUser = txJson.Destination === address;
      const isFromIssuer = txJson.Account === ISSUERS.bRLUSD;

      return isPayment && isToUser && isFromIssuer;
    });

    logger.debug('Mint transactions filtered (all attempts)', { count: mintTransactions.length });

    // 各mintトランザクションの詳細をログ出力
    mintTransactions.forEach((tx: any, index: number) => {
      const txJson = tx.tx_json;
      const memo = txJson.Memos?.[0]?.Memo;

      logger.debug(`Mint transaction ${index + 1} details:`, {
        txHash: tx.hash,
        memo: memo,
        memoType: memo?.MemoType,
        memoData: memo?.MemoData,
        destination: txJson.Destination,
        account: txJson.Account,
        transactionResult: tx.meta?.TransactionResult,
        status: isTransactionSuccessful(tx.meta?.TransactionResult) ? 'SUCCESS' : 'FAILED',
      });
    });

    // 5. ClaimableなDepositを特定（正しい突合ロジックを使用）
    const claimableDeposits: Array<{
      txHash: string;
      uuid: string | undefined;
      amount: string;
      currency: string;
      issuer: string;
      destination: string;
      account: string;
      transactionResult: string;
      mintStatus?: string;
      mintTxHash?: string;
      mintTransactionResult?: string;
    }> = [];

    const claimedDeposits: Array<{
      txHash: string;
      uuid: string | undefined;
      amount: string;
      currency: string;
      issuer: string;
      destination: string;
      account: string;
      transactionResult: string;
      mintStatus: string;
      mintTxHash: string;
      mintTransactionResult: string;
    }> = [];

    for (const deposit of validDeposits) {
      // 正しい突合ロジックを使用
      const correspondingMint = findCorrespondingMint(deposit, mintTransactions, logger);

      if (correspondingMint) {
        if (isTransactionSuccessful(correspondingMint.meta?.TransactionResult)) {
          // 成功したMintのみ「Claim済み」として扱う
          claimedDeposits.push({
            ...deposit,
            mintTxHash: correspondingMint.hash,
            mintStatus: 'CLAIMED',
            mintTransactionResult: correspondingMint.meta?.TransactionResult,
          });

          logger.debug('Deposit history item processed - claimed (successful)', {
            uuid: deposit.uuid,
            depositTxHash: deposit.txHash,
            mintTxHash: correspondingMint.hash,
            mintStatus: 'CLAIMED',
            mintTransactionResult: correspondingMint.meta?.TransactionResult,
          });
        } else {
          // 失敗したMintは「Claimable」として扱う（再試行可能）
          claimableDeposits.push({
            ...deposit,
            mintTxHash: correspondingMint.hash,
            mintStatus: 'MINT_FAILED',
            mintTransactionResult: correspondingMint.meta?.TransactionResult,
          });

          logger.debug('Deposit history item processed - claimable (failed mint)', {
            uuid: deposit.uuid,
            depositTxHash: deposit.txHash,
            mintTxHash: correspondingMint.hash,
            mintStatus: 'MINT_FAILED',
            mintTransactionResult: correspondingMint.meta?.TransactionResult,
          });
        }
      } else {
        // Mint履歴に対応するUUIDがない場合（Claimable）
        claimableDeposits.push(deposit);

        logger.debug('Deposit history item processed - claimable (no mint)', {
          uuid: deposit.uuid,
          depositTxHash: deposit.txHash,
          mintStatus: 'NOT_CLAIMED',
        });
      }
    }

    logger.debug('Claimable deposits identified', { count: claimableDeposits.length });
    logger.debug('Claimed deposits identified', { count: claimedDeposits.length });

    // 6. Claimable Amountを計算
    const claimableAmount = claimableDeposits.reduce(
      (sum, deposit) => sum + parseFloat(deposit.amount),
      0
    );
    const totalDeposited = validDeposits.reduce(
      (sum, deposit) => sum + parseFloat(deposit.amount),
      0
    );
    const totalClaimed = claimedDeposits.reduce(
      (sum, deposit) => sum + parseFloat(deposit.amount),
      0
    );

    // 7. 最終的なClaim Statusを構築
    const claimStatus = {
      isClaimable: claimableDeposits.length > 0,
      claimableAmount: claimableAmount.toFixed(6),
      depositHistory: [
        ...claimableDeposits.map((deposit) => ({
          uuid: deposit.uuid,
          txHash: deposit.txHash,
          amount: deposit.amount,
          fromAddress: deposit.account,
          isClaimed: false,
          mintStatus: deposit.mintStatus || 'NOT_CLAIMED', // MINT_FAILEDも含める
          mintTxHash: deposit.mintTxHash, // 失敗したMintのTxHashも表示
          timestamp: 'Deposited: ' + new Date().toLocaleDateString('ja-JP'),
        })),
        ...claimedDeposits.map((deposit) => ({
          uuid: deposit.uuid,
          txHash: deposit.txHash,
          amount: deposit.amount,
          fromAddress: deposit.account,
          isClaimed: true,
          mintTxHash: deposit.mintTxHash,
          mintStatus: deposit.mintStatus,
          timestamp: 'Claimed: ' + new Date().toLocaleDateString('ja-JP'),
        })),
      ],
    };

    logger.info('Final claim status details', {
      isClaimable: claimStatus.isClaimable,
      claimableAmount: claimStatus.claimableAmount,
      claimableDepositsCount: claimableDeposits.length,
      claimedDepositsCount: claimedDeposits.length,
      totalDepositsCount: validDeposits.length,
      invalidTransactionsCount: invalidTransactions.length,
      mintTransactionsCount: mintTransactions.length,
    });

    // 8. レスポンスを構築
    const response = {
      currency: 'bRLUSD', // 'RLUSD'から'bRLUSD'に修正
      canClaim: claimableDeposits.length > 0,
      claimableAmount: claimableAmount.toFixed(2),
      depositHistory: claimStatus.depositHistory,
      totalDeposited: totalDeposited.toFixed(2),
      totalClaimed: totalClaimed.toFixed(2),
      issuerAddress: ISSUERS.bRLUSD, // 修正: bRLUSD Issuerアドレスを返す
    };

    logger.info('Request completed successfully');
    return createSuccessResponse([response], 'trustline');
  } catch (error) {
    logger.error('Unexpected error occurred', error);
    return createErrorResponse('Claim Status API', error);
  }
}
