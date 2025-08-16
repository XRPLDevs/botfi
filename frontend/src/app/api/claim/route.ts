import { NextResponse } from 'next/server';
import { z } from 'zod';
import { encodeCurrencyCode } from '@/utils/currency';
import { encodeUuid } from '@/utils/uuid';
import { ISSUERS } from '@/lib/constants';
import { validateJwt, createErrorResponse, createSuccessResponse, ApiLogger, parseFormData } from '@/lib/api-utils';
import { env } from '@/lib/env';

// Claim用のスキーマ
const ClaimSchema = z.object({
  deposits: z.array(z.object({
    currency: z.string().min(1),
    issuer: z.string().min(1),
    amount: z.string(),
    uuid: z.string().min(1), // UUID for consistency check
    userAddress: z.string().min(1), // ユーザーのアドレス
  })).min(1), // 最低1つのdepositが必要
});

// 連続実行防止用の処理中Claim管理
const processingClaims = new Set<string>();

export async function POST(request: Request) {
  const logger = new ApiLogger('Claim API');
  
  try {
    logger.info('Starting request processing');

    // 環境変数の検証
    if (!env.ISSUER_WALLET_SEED) {
      logger.error('ISSUER_WALLET_SEED environment variable is not set');
      return createErrorResponse('Claim API', null, 500, 'Server configuration error');
    }

    // JWT認証
    const jwtValidation = await validateJwt(request, 'Claim API');
    if (!jwtValidation.success) {
      logger.warn('JWT validation failed', { error: jwtValidation.error });
      return createErrorResponse('Claim API', null, jwtValidation.status, jwtValidation.error);
    }

    const { address } = jwtValidation;
    logger.info('JWT validation successful', { address });

    // FormData解析
    const formData = await parseFormData(request, 'Claim API');
    
    // 複数depositの処理
    const deposits = [];
    let index = 0;
    
    // FormDataから複数のdepositを抽出
    while (formData.has(`deposits[${index}].currency`)) {
      deposits.push({
        currency: formData.get(`deposits[${index}].currency`) as string,
        issuer: formData.get(`deposits[${index}].issuer`) as string,
        amount: formData.get(`deposits[${index}].amount`) as string,
        uuid: formData.get(`deposits[${index}].uuid`) as string,
        userAddress: formData.get(`deposits[${index}].userAddress`) as string,
      });
      index++;
    }

    logger.debug('Extracted deposits', { count: deposits.length, deposits });

    // スキーマ検証
    const parsed = ClaimSchema.safeParse({ deposits });
    if (!parsed.success) {
      logger.warn('Schema validation failed', { error: parsed.error.message });
      return createErrorResponse('Claim API', null, 400, 'Invalid input data');
    }

    logger.info('Schema validation successful', { depositCount: deposits.length });

    // 連続実行防止: 各UUIDでの重複処理をブロック
    const claimKeys = deposits.map(d => d.uuid);
    const duplicateKeys = claimKeys.filter(key => processingClaims.has(key));
    
    if (duplicateKeys.length > 0) {
      logger.warn('Duplicate requests blocked', { uuids: duplicateKeys });
      return createErrorResponse('Claim API', null, 409, 'Some claims are already being processed');
    }

    // 処理中としてマーク
    claimKeys.forEach(key => processingClaims.add(key));
    logger.debug('Claims marked as processing', { uuids: claimKeys });

    try {
      // XRPL WalletとClientの初期化
      const { Wallet, Client } = await import('xrpl');
      const issuerWallet = Wallet.fromSeed(env.ISSUER_WALLET_SEED);
      const client = new Client(env.XRPL_NODE_URL);
      
      logger.info('XRPL components initialized', { 
        issuerAddress: issuerWallet.address,
        nodeUrl: env.XRPL_NODE_URL,
        environment: env.NODE_ENV
      });

      // クライアントに接続
      await client.connect();
      logger.debug('Connected to XRPL');

      // 各depositに対して個別のclaimトランザクションを実行
      const results = [];
      const errors = [];

      for (const [index, deposit] of deposits.entries()) {
        try {
          logger.info(`Processing deposit ${index + 1}/${deposits.length}`, { uuid: deposit.uuid });

          // 通貨コードとUUIDのエンコード
          const encodedCurrency = encodeCurrencyCode(deposit.currency);
          const encodedUuid = encodeUuid(deposit.uuid);
          
          logger.debug('Encoded data', { 
            currency: encodedCurrency, 
            uuid: encodedUuid 
          });

          // Paymentトランザクションのペイロードを作成（mint処理）
          const transaction = {
            TransactionType: 'Payment' as const,
            Account: issuerWallet.address,
            Destination: deposit.userAddress,
            Amount: {
              currency: encodedCurrency,
              issuer: deposit.issuer,
              value: deposit.amount,
            },
            Memos: [
              {
                Memo: {
                  MemoType: '746578742f706c61696e', // "text/plain" in hex
                  MemoFormat: '746578742f706c61696e', // "text/plain" in hex
                  MemoData: encodedUuid,
                },
              },
            ],
          };

          logger.debug('Transaction payload created', transaction);

          // トランザクションの自動補完
          const autofilledTx = await client.autofill(transaction);
          logger.debug('Transaction autofilled');

          // トランザクションの署名
          const { tx_blob, hash } = issuerWallet.sign(autofilledTx);
          logger.info('Transaction signed', { hash });

          // 署名済みトランザクションを送信
          logger.info('Submitting signed transaction to XRPL');
          const result = await client.submit(tx_blob);
          
          if (result.result.engine_result === 'tesSUCCESS') {
            logger.info('Transaction submitted successfully', { 
              hash, 
              resultCode: result.result.engine_result,
              ledgerIndex: result.result.validated_ledger_index
            });
            
            results.push({
              uuid: deposit.uuid,
              success: true,
              txHash: hash,
              resultCode: result.result.engine_result,
              ledgerIndex: result.result.validated_ledger_index,
            });
          } else {
            logger.error('Transaction submission failed', { 
              hash, 
              result: result.result
            });
            
            errors.push({
              uuid: deposit.uuid,
              success: false,
              error: 'Transaction submission failed',
              result: result.result
            });
          }
        } catch (error) {
          logger.error(`Error processing deposit ${index + 1}`, { uuid: deposit.uuid, error });
          errors.push({
            uuid: deposit.uuid,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // 結果の集計
      const successCount = results.length;
      const errorCount = errors.length;
      
      logger.info('All deposits processed', { 
        total: deposits.length, 
        success: successCount, 
        errors: errorCount 
      });

      // レスポンスの生成
      if (successCount > 0) {
        return createSuccessResponse({
          ok: true,
          totalDeposits: deposits.length,
          successfulClaims: successCount,
          failedClaims: errorCount,
          results,
          errors: errorCount > 0 ? errors : undefined,
        });
      } else {
        return createErrorResponse('Claim API', null, 500, 'All claim transactions failed');
      }
    } finally {
      // 処理完了後、処理中マークを削除
      claimKeys.forEach(key => processingClaims.delete(key));
      logger.debug('Claims processing completed', { uuids: claimKeys });
    }
  } catch (error) {
    logger.error('Unexpected error occurred', error);
    return createErrorResponse('Claim API', error);
  }
}
