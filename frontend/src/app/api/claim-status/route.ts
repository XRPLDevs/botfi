import { NextResponse } from 'next/server';
import { cacheTags } from '@/lib/cacheTags';
import { XRPLClient } from '@/lib/xrplClient';
import { DEPOSIT_ADDRESS, ISSUERS } from '@/lib/constants';
import { decodeUuid, isValidUuid } from '@/utils/uuid';
import { validateJwt, createErrorResponse, createSuccessResponse, ApiLogger } from '@/lib/api-utils';

// レスポンス用の型定義
type ClaimStatusResponse = {
  currency: string;
  canClaim: boolean;
  claimableAmount: string;
  depositHistory: Array<{
    uuid: string;
    amount: string;
    timestamp: string;
    fromAddress: string;
    isClaimed: boolean;
  }>;
  totalDeposited: string;
  totalClaimed: string;
};

export async function GET(request: Request, _context: { params: Promise<Record<string, never>> }) {
  const logger = new ApiLogger('Claim Status API');
  
  try {
    logger.info('Starting request processing');

    // JWT認証
    const jwtValidation = await validateJwt(request, 'Claim Status API');
    if (!jwtValidation.success) {
      logger.warn('JWT validation failed', { error: jwtValidation.error });
      return createErrorResponse('Claim Status API', null, jwtValidation.status, jwtValidation.error);
    }

    const { address, jwtData } = jwtValidation;
    logger.info('JWT validation successful', { address });

    // XRPLからトランザクション履歴を取得してClaim可能状態を判定
    const xrplClient = new XRPLClient(jwtData.network_endpoint);
    
    // 1. ユーザーアドレスがdeposit addressに送金したトランザクションを取得
    logger.debug('Fetching user transactions', { address, limit: 200 });
    const userTransactions = await xrplClient.requestAccountTx(address, 200);
    logger.info('User transactions fetched', { count: userTransactions.length });
    
    // 2. deposit addressへの送金トランザクションを抽出（memoフィールドが存在するもののみ）
    const depositTransactions = userTransactions.filter((tx: any) => {
      const txJson = tx.tx_json;
      const isPayment = txJson.TransactionType === 'Payment';
      const isToDepositAddress = txJson.Destination === DEPOSIT_ADDRESS;
      const isFromUser = txJson.Account === address;
      const hasMemo = txJson.Memos && 
                     txJson.Memos.length > 0 && 
                     txJson.Memos[0]?.Memo?.MemoData && 
                     txJson.Memos[0].Memo.MemoData.length > 0;
      
      return isPayment && isToDepositAddress && isFromUser && hasMemo;
    });
    
    logger.info('Deposit transactions filtered', { count: depositTransactions.length });

    // 3. issuer addressのトランザクション履歴を取得
    const issuerAddress = ISSUERS.bRLUSD;
    logger.debug('Fetching issuer transactions', { issuerAddress, limit: 200 });
    const issuerTransactions = await xrplClient.requestAccountTx(issuerAddress, 200);
    
    // 4. issuerがユーザーアドレスにmintしたトランザクションを抽出
    const mintTransactions = issuerTransactions.filter((tx: any) => {
      const txJson = tx.tx_json;
      return (
        txJson.TransactionType === 'Payment' &&
        txJson.Destination === address &&
        txJson.Account === issuerAddress
      );
    });

    logger.debug('Mint transactions filtered', { count: mintTransactions.length });

    // 5. depositトランザクションのmemoからUUIDを抽出し、mint済みかチェック
    const depositHistory = depositTransactions.map((tx: any) => {
      const txJson = tx.tx_json;
      const memo = txJson.Memos?.[0]?.Memo?.MemoData;
      
      // memoからUUIDを抽出
      let uuid: string | null = null;
      if (memo) {
        try {
          const decodedUuid = decodeUuid(memo);
          if (isValidUuid(decodedUuid)) {
            uuid = decodedUuid;
          }
        } catch (error) {
          logger.warn('Failed to decode UUID from memo', { memo, error });
        }
      }
      
      // currency + issuer確認: bRLUSDトークンの正規性を検証
      const txAmount = txJson.Amount;
      if (txAmount && typeof txAmount === 'object') {
        const currency = txAmount.currency;
        const issuer = txAmount.issuer;
        
        // bRLUSDトークンの正規性チェック
        if (currency !== 'bRLUSD' || issuer !== ISSUERS.bRLUSD) {
          logger.warn('Invalid currency or issuer for bRLUSD claim', { 
            currency, 
            issuer, 
            expectedIssuer: ISSUERS.bRLUSD 
          });
          return null; // 不正なトークンは除外
        }
      }
      
      // 金額の取得
      let amount: string | undefined;
      if (txJson.Amount) {
        amount = txJson.Amount;
      } else if (txJson.DeliverMax) {
        amount = txJson.DeliverMax.value;
      } else if (tx.meta?.delivered_amount?.value) {
        amount = tx.meta.delivered_amount.value;
      }
      
      // タイムスタンプの取得
      let timestamp: string | undefined;
      if (tx.close_time_iso) {
        timestamp = tx.close_time_iso;
      } else if (tx.date !== undefined) {
        const unixTimestamp = (tx.date + 946684800) * 1000;
        timestamp = new Date(unixTimestamp).toISOString();
      } else {
        timestamp = new Date().toISOString();
      }
      
      const fromAddress = txJson.Account;
      
      // mint履歴でUUIDが存在するかチェック
      const isClaimed = mintTransactions.some((mintTx: any) => {
        const mintTxJson = mintTx.tx_json;
        const mintMemo = mintTxJson.Memos?.[0]?.Memo?.MemoData;
        
        if (mintMemo) {
          try {
            const mintDecodedUuid = decodeUuid(mintMemo);
            return mintDecodedUuid === uuid;
          } catch (error) {
            logger.warn('Failed to decode UUID from mint memo', { mintMemo, error });
            return false;
          }
        }
        return false;
      });

      return {
        uuid: uuid || `unknown-${tx.hash}`,
        amount: amount || '0',
        timestamp: timestamp || new Date().toISOString(),
        fromAddress,
        isClaimed,
      };
    });

    // 6. Claim可能なdepositのみを抽出
    const validDepositHistory = depositHistory.filter((deposit): deposit is NonNullable<typeof deposit> => deposit !== null);
    const claimableDeposits = validDepositHistory.filter((deposit) => !deposit.isClaimed);
    const totalDeposited = validDepositHistory.reduce((sum: number, deposit) => sum + parseFloat(deposit.amount), 0);
    const totalClaimed = validDepositHistory.filter((deposit) => deposit.isClaimed)
      .reduce((sum: number, deposit) => sum + parseFloat(deposit.amount), 0);
    const claimableAmount = claimableDeposits.reduce((sum: number, deposit) => sum + parseFloat(deposit.amount), 0);

    logger.info('Claim status calculated', {
      totalDeposits: validDepositHistory.length,
      claimableDeposits: claimableDeposits.length,
      totalDeposited,
      totalClaimed,
      claimableAmount
    });

    const claimStatusResponse: ClaimStatusResponse[] = [
      {
        currency: 'bRLUSD',
        canClaim: claimableDeposits.length > 0,
        claimableAmount: claimableAmount.toFixed(2),
        depositHistory: validDepositHistory,
        totalDeposited: totalDeposited.toFixed(2),
        totalClaimed: totalClaimed.toFixed(2),
      },
    ];

    logger.info('Request completed successfully');
    return createSuccessResponse(claimStatusResponse, cacheTags.trustline);
  } catch (error) {
    logger.error('Unexpected error occurred', error);
    return createErrorResponse('Claim Status API', error);
  }
}
