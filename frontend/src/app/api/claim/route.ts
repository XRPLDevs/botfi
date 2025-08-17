import { z } from 'zod';
import { encodeUuid } from '@/utils/uuid';
import { ENCODED_MEMO_TYPE_ID } from '@/utils/memo-validation';
import {
  validateJwt,
  createErrorResponse,
  createSuccessResponse,
  ApiLogger,
  parseFormData,
} from '@/lib/api-utils';
import { env } from '@/lib/env';
import {
  validateTransactionIntegrity,
  isTransactionSuccessful,
} from '@/lib/transaction-validation';

// Claim用のスキーマ（簡素化）
const ClaimSchema = z.object({
  deposits: z
    .array(
      z.object({
        uuid: z.string().min(1), // UUIDのみ必要
        userAddress: z.string().min(1), // ユーザーのアドレス
      })
    )
    .min(1), // 最低1つのdepositが必要
});

// 連続実行防止用の処理中Claim管理
const processingClaims = new Set<string>();

export async function POST(request: Request) {
  const logger = new ApiLogger('Claim API');

  try {
    logger.info('Starting request processing');

    // JWT認証
    const jwtValidation = await validateJwt(request, 'Claim API');
    if (!jwtValidation.success) {
      logger.warn('JWT validation failed', { error: jwtValidation.error });
      return createErrorResponse('Claim API', null, jwtValidation.status, jwtValidation.error);
    }

    const { address, jwtData } = jwtValidation;
    logger.info('JWT validation successful', { address });

    // トークン設定の確認とログ出力
    const { getBRLUSDConfig } = await import('@/lib/constants/tokens');
    const brlusdConfig = getBRLUSDConfig();

    logger.info('Token configuration loaded', {
      currency: brlusdConfig.currency,
      displayCurrency: brlusdConfig.displayCurrency,
      issuer: brlusdConfig.issuer,
      displayName: brlusdConfig.displayName,
    });

    // FormData解析
    const formData = await parseFormData(request, 'Claim API');

    // Debug: FormDataの内容をログ出力
    logger.debug('FormData contents:', {
      hasDeposits0Uuid: formData.has('deposits[0].uuid'),
      hasDeposits0UserAddress: formData.has('deposits[0].userAddress'),
      deposits0Uuid: formData.get('deposits[0].uuid'),
      deposits0UserAddress: formData.get('deposits[0].userAddress'),
    });

    // 複数depositの処理
    const deposits = [];
    let index = 0;

    // FormDataから複数のdepositを抽出（新しいスキーマに合わせて修正）
    while (formData.has(`deposits[${index}].uuid`)) {
      const deposit = {
        uuid: formData.get(`deposits[${index}].uuid`) as string,
        userAddress: formData.get(`deposits[${index}].userAddress`) as string,
      };

      deposits.push(deposit);

      logger.debug(`Deposit ${index} extracted:`, deposit);
      index++;
    }

    logger.debug('Extracted deposits', { count: deposits.length, deposits });

    // スキーマ検証
    const parsed = ClaimSchema.safeParse({ deposits });
    if (!parsed.success) {
      logger.warn('Schema validation failed', {
        error: parsed.error.message,
        errorDetails: parsed.error.issues,
        deposits: deposits,
      });
      return createErrorResponse('Claim API', null, 400, 'Invalid input data');
    }

    logger.info('Schema validation successful', { depositCount: deposits.length });

    // 連続実行防止チェック
    const claimKeys = deposits.map((d) => `${d.uuid}-${d.userAddress}`);
    const alreadyProcessing = claimKeys.some((key) => processingClaims.has(key));

    if (alreadyProcessing) {
      logger.warn('Claims already being processed', { uuids: claimKeys });
      return createErrorResponse('Claim API', null, 409, 'Claim is already being processed');
    }

    // 処理中マークを設定
    claimKeys.forEach((key) => processingClaims.add(key));
    logger.debug('Claims marked as processing', { uuids: claimKeys });

    // 重複チェックの詳細ログ
    logger.info('Starting duplicate check for deposits', {
      depositCount: deposits.length,
      uuids: deposits.map((d) => d.uuid),
      userAddresses: deposits.map((d) => d.userAddress),
      expectedCurrency: brlusdConfig.currency,
      expectedIssuer: brlusdConfig.issuer,
    });

    try {
      // 各depositの整合性チェックと情報取得
      logger.info('Starting claim validation for all deposits');
      const validatedDeposits = [];

      // XRPLClientの初期化
      const { XRPLClient } = await import('@/lib/xrplClient');
      const xrplClient = new XRPLClient(); // 環境変数から自動的にネットワークを選択
      
      // ネットワーク情報をログ出力
      const networkInfo = xrplClient.getNetworkInfo();
      logger.info('XRPL Client initialized', {
        network: networkInfo.network,
        endpoint: networkInfo.endpoint,
        maxHistoryLimit: networkInfo.config.maxHistoryLimit
      });

      for (const deposit of deposits) {
        try {
          const depositInfo = await validateTransactionIntegrity(
            deposit,
            address,
            logger,
            xrplClient
          );
          validatedDeposits.push(depositInfo);

          logger.info('Deposit validation successful', {
            uuid: deposit.uuid,
            currency: depositInfo.currency,
            issuer: depositInfo.issuer,
            amount: depositInfo.amount,
          });
        } catch (error) {
          logger.error('Deposit validation failed', {
            uuid: deposit.uuid,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          });

          // 具体的なエラーメッセージを生成
          let errorMessage = 'Deposit validation failed';
          if (error instanceof Error) {
            if (error.message.includes('Deposit already minted')) {
              errorMessage = `Deposit ${deposit.uuid} has already been minted. Please check the transaction history.`;
            } else if (error.message.includes('Address mismatch')) {
              errorMessage = `Address mismatch for deposit ${deposit.uuid}. Please verify the deposit address.`;
            } else if (error.message.includes('Token validation failed')) {
              errorMessage = `Token validation failed for deposit ${deposit.uuid}. Please check the currency and issuer settings.`;
            } else {
              errorMessage = error.message;
            }
          }

          return createErrorResponse('Claim API', null, 400, errorMessage);
        }
      }

      logger.info('All deposits validated and info extracted', { count: validatedDeposits.length });

      // XRPL WalletとClientの初期化
      const { Wallet } = await import('xrpl');
      const issuerWallet = Wallet.fromSeed(env.BRLUSD_ISSUER_SEED);
      // xrplClientは既に初期化済み

      logger.info('Processing claim transactions', {
        issuerAddress: issuerWallet.address,
        depositCount: validatedDeposits.length,
      });

      // XRPLクライアントに接続（xrplClientを使用）
      logger.debug('Using initialized XRPL client');

      const results: Array<{
        uuid: string;
        success: boolean;
        txHash?: string;
        resultCode?: string;
        ledgerIndex?: number;
        error?: string;
        result?: any;
      }> = [];

      const errors: Array<{
        uuid: string;
        success: boolean;
        error: string;
        result?: any;
      }> = [];

      try {
        // 各depositに対して個別のclaimトランザクションを実行
        for (let index = 0; index < validatedDeposits.length; index++) {
          const depositInfo = validatedDeposits[index];

          try {
            logger.info(`Processing deposit ${index + 1}/${validatedDeposits.length}`, {
              uuid: depositInfo.uuid,
            });

            // bRLUSD設定を取得
            const brlusdConfig = getBRLUSDConfig();

            // Deposit txから取得した情報を使用（bRLUSD設定で上書き）
            const transaction = {
              TransactionType: 'Payment' as const,
              Flags: 0,
              Account: issuerWallet.address,
              Destination: depositInfo.userAddress, // Deposit txの送信者アドレス
              Amount: {
                currency: brlusdConfig.currency, // ← 定数から取得（bRLUSD）
                issuer: brlusdConfig.issuer, // ← 定数から取得（bRLUSD issuer）
                value: depositInfo.amount, // Deposit txのamount
              },
              Memos: [
                {
                  Memo: {
                    MemoType: ENCODED_MEMO_TYPE_ID,
                    MemoData: encodeUuid(depositInfo.uuid),
                  },
                },
              ],
            };

            logger.debug('Claim transaction payload created', {
              uuid: depositInfo.uuid,
              transaction: {
                ...transaction,
                Amount: {
                  ...transaction.Amount,
                  displayCurrency: brlusdConfig.displayCurrency, // ← デコード済み通貨コード（画面表示用）
                  encodedCurrency: transaction.Amount.currency, // ← エンコード済み通貨コード（内部処理用）
                },
              },
            });

            // トランザクションの自動補完
            const autofilledTx = await xrplClient.autofill(transaction);
            logger.debug('Transaction autofilled');

            // トランザクションの署名
            const { tx_blob, hash } = issuerWallet.sign(autofilledTx);
            logger.info('Transaction signed', { hash });

            // 署名済みトランザクションを送信
            logger.info('Submitting signed transaction to XRPL');
            const result = await xrplClient.submit(tx_blob);

            if (isTransactionSuccessful(result.result.engine_result)) {
              logger.info('Transaction submitted successfully', {
                hash,
                resultCode: result.result.engine_result,
                ledgerIndex: result.result.validated_ledger_index,
              });

              results.push({
                uuid: depositInfo.uuid,
                success: true,
                txHash: hash,
                resultCode: result.result.engine_result,
                ledgerIndex: result.result.validated_ledger_index,
              });
            } else {
              logger.error('Transaction submission failed', {
                hash,
                result: result.result,
                engineResult: result.result.engine_result,
                engineResultMessage: result.result.engine_result_message,
              });

              // XRPLのエラーコードに基づいて適切なエラーメッセージを生成
              let errorMessage = 'Transaction submission failed';
              if (result.result.engine_result === 'tecPATH_DRY') {
                errorMessage = 'Path could not send partial amount - insufficient liquidity';
              } else if (result.result.engine_result === 'tecUNFUNDED_PAYMENT') {
                errorMessage = 'Insufficient funds for payment';
              } else if (result.result.engine_result === 'tecNO_LINE') {
                errorMessage = 'No trustline exists';
              }

              errors.push({
                uuid: depositInfo.uuid,
                success: false,
                error: errorMessage,
                result: result.result,
              });
            }
          } catch (error) {
            logger.error(`Error processing deposit ${index + 1}`, {
              uuid: depositInfo.uuid,
              error,
            });
            errors.push({
              uuid: depositInfo.uuid,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      } finally {
        // XRPLクライアントの接続を切断
        await xrplClient.disconnect();
        logger.debug('Disconnected from XRPL network');
      }

      // 結果の集計
      const successCount = results.length;
      const errorCount = errors.length;

      logger.info('All deposits processed', {
        total: deposits.length,
        success: successCount,
        errors: errorCount,
      });

      // 処理完了後の3秒スリープ
      logger.info('Processing completed, waiting 3 seconds before response');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      logger.info('3 second wait completed, sending response');

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
        // 具体的なエラーメッセージを生成
        let errorMessage = 'All claim transactions failed';
        if (errors.length > 0) {
          const firstError = errors[0];
          if (firstError.error.includes('Path could not send partial amount')) {
            errorMessage = 'Insufficient liquidity for claim transaction';
          } else if (firstError.error.includes('Insufficient funds')) {
            errorMessage = 'Insufficient funds for claim transaction';
          } else if (firstError.error.includes('No trustline')) {
            errorMessage = 'No trustline found for claim transaction';
          } else {
            errorMessage = firstError.error;
          }
        }

        return createErrorResponse('Claim API', null, 500, errorMessage);
      }
    } finally {
      // 処理完了後、処理中マークを削除
      claimKeys.forEach((key) => processingClaims.delete(key));
      logger.debug('Claims processing completed', { uuids: claimKeys });
    }
  } catch (error) {
    logger.error('Unexpected error occurred', error);
    return createErrorResponse('Claim API', error);
  }
}
