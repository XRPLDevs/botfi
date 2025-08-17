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
  expectedMemoType: string,
  logger: ApiLogger
): MemoValidationResult {
  try {
    // Memoオブジェクトの存在確認
    if (!memo) {
      return {
        isValid: false,
        error: 'Memo object not found',
        uuid: undefined,
      };
    }

    // MemoTypeの存在確認
    if (!memo.MemoType) {
      return {
        isValid: false,
        error: 'MemoType not found',
        uuid: undefined,
      };
    }

    // MemoTypeのデコードと検証
    let decodedMemoType: string;
    try {
      decodedMemoType = Buffer.from(memo.MemoType, 'hex').toString();
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to decode MemoType: ${error}`,
        uuid: undefined,
      };
    }

    // MemoTypeの比較（デコードされた値で比較）
    if (decodedMemoType !== expectedMemoType) {
      return {
        isValid: false,
        error: `MemoType mismatch. Expected: "${expectedMemoType}", Got: "${decodedMemoType}"`,
        uuid: undefined,
      };
    }

    // MemoDataの存在確認
    if (!memo.MemoData) {
      return {
        isValid: false,
        error: 'MemoData not found',
        uuid: undefined,
      };
    }

    // MemoDataからUUIDを抽出
    let uuid: string;
    try {
      uuid = Buffer.from(memo.MemoData, 'hex').toString();
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to decode MemoData: ${error}`,
        uuid: undefined,
      };
    }

    // UUIDの形式検証
    if (!isValidUUID(uuid)) {
      return {
        isValid: false,
        error: `Invalid UUID format: ${uuid}`,
        uuid: undefined,
      };
    }

    // 成功
    return {
      isValid: true,
      error: undefined,
      uuid,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Unexpected error during memo validation: ${error}`,
      uuid: undefined,
    };
  }
}

// UUIDの形式検証
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// トランザクション配列からUUIDで検索
export async function findTransactionByUuid(
  transactions: any[],
  uuid: string,
  expectedMemoType: string,
  logger: ApiLogger
): Promise<any | null> {
  try {
    let checkedCount = 0;

    for (const tx of transactions) {
      checkedCount++;

      // Memoの存在確認
      const memos = tx.tx_json?.Memos;
      if (!memos || memos.length === 0) {
        continue;
      }

      // 各Memoをチェック
      for (const memoWrapper of memos) {
        const memo = memoWrapper.Memo;
        if (!memo) {
          continue;
        }

        // Memoの検証
        const validation = validateMemo(memo, expectedMemoType, logger);
        if (validation.isValid && validation.uuid === uuid) {
          return tx;
        }
      }
    }

    return null;
  } catch (error) {
    logger.error('Error during UUID search', error);
    return null;
  }
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
      expectedMemoType: expectedMemoType,
    });
  }

  const validTransactions = transactions.filter((tx: any) => {
    const txJson = tx.tx_json;
    const memo = txJson.Memos?.[0]?.Memo;

    if (!memo) {
      if (logger) {
        logger.debug('Transaction skipped: No memo found', {
          txHash: tx.hash,
        });
      }
      return false;
    }

    if (!logger) {
      return false;
    }

    const validation = validateMemo(memo, expectedMemoType, logger);
    if (!validation.isValid) {
      if (logger) {
        logger.debug('Transaction skipped: Invalid memo', {
          txHash: tx.hash,
          error: validation.error,
        });
      }
      return false;
    }

    if (logger) {
      logger.debug('Transaction included: Valid memo', {
        txHash: tx.hash,
        memoType: validation.memoType,
        uuid: validation.uuid,
      });
    }
    return true;
  });

  if (logger) {
    logger.debug('Memo filtering completed:', {
      totalTransactions: transactions.length,
      validTransactions: validTransactions.length,
      expectedMemoType: expectedMemoType,
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
