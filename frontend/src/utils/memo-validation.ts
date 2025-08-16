import { decodeUuid, isValidUuid } from './uuid';
import { encodeMemoType, decodeMemoType } from './currency';
import { ApiLogger } from '@/lib/api-utils';

/**
 * Memoの整合性チェック結果
 */
export interface MemoValidationResult {
  isValid: boolean;
  uuid?: string;
  memoType?: string;
  error?: string;
}

/**
 * Memoの整合性チェックを行う共通関数
 * @param memo - XRPLトランザクションのMemoオブジェクト
 * @param expectedMemoType - 期待されるMemoType（エンコードされた値または文字列）
 * @param logger - ログ出力用のApiLogger
 * @returns MemoValidationResult
 */
export function validateMemo(
  memo: any, 
  expectedMemoType: string = ENCODED_MEMO_TYPE_ID,
  logger?: ApiLogger
): MemoValidationResult {
  try {
    // Memoオブジェクトの存在確認
    if (!memo) {
      if (logger) {
        logger.debug('Memo validation failed: Memo object not found');
      }
      return {
        isValid: false,
        error: 'Memo object not found'
      };
    }

    // Debug: Memoオブジェクトの構造をログ出力
    if (logger) {
      logger.debug('Memo validation started:', {
        memo: memo,
        memoType: memo.MemoType,
        memoData: memo.MemoData,
        memoFormat: memo.MemoFormat,
        expectedMemoType: expectedMemoType
      });
    }

    // MemoTypeの存在確認
    if (!memo.MemoType) {
      if (logger) {
        logger.debug('Memo validation failed: MemoType not found');
      }
      return {
        isValid: false,
        error: 'MemoType not found'
      };
    }

    // MemoTypeの検証（エンコードされた値と直接比較）
    let decodedMemoType: string;
    let isEncodedExpected: boolean;
    
    try {
      decodedMemoType = decodeMemoType(memo.MemoType);
      if (logger) {
        logger.debug('MemoType decoded successfully:', {
          encoded: memo.MemoType,
          decoded: decodedMemoType
        });
      }
      
      // 期待される値がエンコードされた値かどうかを判定
      isEncodedExpected = expectedMemoType === ENCODED_MEMO_TYPE_ID;
      
      if (isEncodedExpected) {
        // エンコードされた値が期待される場合、直接比較
        if (memo.MemoType !== expectedMemoType) {
          if (logger) {
            logger.debug('MemoType mismatch detected (encoded comparison):', { 
              actual: memo.MemoType, 
              expected: expectedMemoType,
              decoded: decodedMemoType
            });
          }
          return {
            isValid: false,
            memoType: decodedMemoType,
            error: `MemoType mismatch: expected "${expectedMemoType}", got "${memo.MemoType}"`
          };
        }
      } else {
        // 文字列が期待される場合、デコード後の値と比較
        if (decodedMemoType !== expectedMemoType) {
          if (logger) {
            logger.debug('MemoType mismatch detected (decoded comparison):', { 
              actual: decodedMemoType, 
              expected: expectedMemoType,
              encoded: memo.MemoType
            });
          }
          return {
            isValid: false,
            memoType: decodedMemoType,
            error: `MemoType mismatch: expected "${expectedMemoType}", got "${decodedMemoType}"`
          };
        }
      }
    } catch (error) {
      if (logger) {
        logger.debug('MemoType decode failed:', {
          encoded: memo.MemoType,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return {
        isValid: false,
        error: `Failed to decode MemoType: ${memo.MemoType}`
      };
    }

    // MemoDataの存在確認
    if (!memo.MemoData) {
      if (logger) {
        logger.debug('Memo validation failed: MemoData not found');
      }
      return {
        isValid: false,
        memoType: decodedMemoType,
        error: 'MemoData not found'
      };
    }

    // UUIDのデコードと検証
    let uuid: string;
    try {
      uuid = decodeUuid(memo.MemoData);
      if (logger) {
        logger.debug('UUID decoded successfully:', {
          encoded: memo.MemoData,
          decoded: uuid
        });
      }
      
      if (!isValidUuid(uuid)) {
        if (logger) {
          logger.debug('UUID validation failed: Invalid UUID format', {
            uuid: uuid
          });
        }
        return {
          isValid: false,
          memoType: decodedMemoType,
          error: 'Invalid UUID format in MemoData'
        };
      }
    } catch (error) {
      if (logger) {
        logger.debug('UUID decode failed:', {
          encoded: memo.MemoData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return {
        isValid: false,
        memoType: decodedMemoType,
        error: `Failed to decode UUID from MemoData: ${memo.MemoData}`
      };
    }

    // 正常な場合
    if (logger) {
      logger.debug('Memo validation completed successfully:', {
        memoType: decodedMemoType,
        uuid: uuid,
        expectedMemoType: expectedMemoType
      });
    }

    return {
      isValid: true,
      uuid,
      memoType: decodedMemoType
    };

  } catch (error) {
    if (logger) {
      logger.debug('Unexpected error during memo validation:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        memo: memo
      });
    }
    return {
      isValid: false,
      error: `Unexpected error during memo validation: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * トランザクションから特定のUUIDを持つ有効なMemoを検索
 * @param transactions - XRPLトランザクションの配列
 * @param targetUuid - 検索対象のUUID
 * @param expectedMemoType - 期待されるMemoType（例: "id"）
 * @param logger - ログ出力用のApiLogger
 * @returns 見つかったトランザクション、またはnull
 */
export function findTransactionByUuid(
  transactions: any[],
  targetUuid: string,
  expectedMemoType: string = 'id',
  logger?: ApiLogger
): any | null {
  return transactions.find((tx: any) => {
    const txJson = tx.tx_json;
    const memo = txJson.Memos?.[0]?.Memo;
    
    if (!memo) {
      return false;
    }

    const validation = validateMemo(memo, expectedMemoType, logger);
    if (!validation.isValid) {
      return false;
    }

    return validation.uuid === targetUuid;
  });
}

/**
 * トランザクション配列から有効なMemoを持つトランザクションをフィルタリング
 * @param transactions - XRPLトランザクションの配列
 * @param expectedMemoType - 期待されるMemoType（例: "id"）
 * @param logger - ログ出力用のApiLogger
 * @returns 有効なMemoを持つトランザクションの配列
 */
export function filterTransactionsByValidMemo(
  transactions: any[],
  expectedMemoType: string = 'id',
  logger?: ApiLogger
): any[] {
  if (logger) {
    logger.debug('Filtering transactions by valid memo:', {
      totalTransactions: transactions.length,
      expectedMemoType: expectedMemoType
    });
  }

  const validTransactions = transactions.filter((tx: any) => {
    const txJson = tx.tx_json;
    const memo = txJson.Memos?.[0]?.Memo;
    
    if (!memo) {
      if (logger) {
        logger.debug('Transaction skipped: No memo found', {
          txHash: tx.hash
        });
      }
      return false;
    }

    const validation = validateMemo(memo, expectedMemoType, logger);
    if (!validation.isValid) {
      if (logger) {
        logger.debug('Transaction skipped: Invalid memo', {
          txHash: tx.hash,
          error: validation.error
        });
      }
      return false;
    }

    if (logger) {
      logger.debug('Transaction included: Valid memo', {
        txHash: tx.hash,
        memoType: validation.memoType,
        uuid: validation.uuid
      });
    }
    return true;
  });

  if (logger) {
    logger.debug('Memo filtering completed:', {
      totalTransactions: transactions.length,
      validTransactions: validTransactions.length,
      expectedMemoType: expectedMemoType
    });
  }

  return validTransactions;
}

/**
 * MemoType「id」の定数
 */
export const MEMO_TYPE_ID = 'id';

/**
 * エンコードされたMemoType「id」の定数
 */
export const ENCODED_MEMO_TYPE_ID = encodeMemoType('id');

/**
 * エンコードされたMemoFormat「text/plain」の定数
 */
export const ENCODED_MEMO_FORMAT_TEXT_PLAIN = '746578742f706c61696e'; // "text/plain" in hex
