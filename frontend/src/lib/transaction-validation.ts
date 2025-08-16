import { ApiLogger } from './api-utils';
import { findTransactionByUuid, validateMemo, ENCODED_MEMO_TYPE_ID } from '../utils/memo-validation';
import { TOKENS, getTokenConfig, getBRLUSDConfig } from './constants';
import { encodeCurrencyCode } from '../utils/currency';

// 定数定義
export const SUCCESS_RESULT = 'tesSUCCESS';

// トランザクション成功判定の共通関数
export function isTransactionSuccessful(transactionResult?: string): boolean {
  return transactionResult === SUCCESS_RESULT;
}

// トランザクションが成功したPaymentかどうかを判定する共通関数
export function isValidPaymentTransaction(tx: any): boolean {
  const txJson = tx.tx_json;
  const isPayment = txJson.TransactionType === 'Payment';
  const isSuccessful = isTransactionSuccessful(tx.meta?.TransactionResult);
  
  return isPayment && isSuccessful;
}

// 通貨コードとissuerの検証を行う共通関数
export function validateTokenCurrency(
  currency: string, 
  issuer: string, 
  logger: ApiLogger
): { isValid: boolean; tokenName?: string; error?: string } {
  try {
    const validTokens = Object.values(TOKENS).map(tokenName => {
      const tokenConfig = getTokenConfig(tokenName);
      return {
        name: tokenName,
        encodedCurrency: tokenConfig.currency,        // ← エンコード済み通貨コード（内部処理用）
        displayCurrency: tokenConfig.displayCurrency, // ← デコード済み通貨コード（画面表示用）
        issuer: tokenConfig.issuer
      };
    });

    const isValidToken = validTokens.some(token => 
      token.encodedCurrency === currency && token.issuer === issuer
    );

    if (!isValidToken) {
      logger.debug('Invalid currency or issuer', { 
        currency,
        issuer,
        displayCurrency: Buffer.from(currency, 'hex').toString()  // ← デコード済み通貨コード（画面表示用）
      });
      return { 
        isValid: false, 
        error: 'Invalid currency or issuer' 
      };
    }

    const validTokenConfig = validTokens.find(token => 
      token.encodedCurrency === currency && token.issuer === issuer
    );

    return { 
      isValid: true, 
      tokenName: validTokenConfig?.name 
    };
  } catch (error) {
    logger.error('Token validation error', { error, currency, issuer });
    return { 
      isValid: false, 
      error: 'Token validation failed' 
    };
  }
}

// トランザクションから通貨情報を抽出する共通関数
export function extractAmountInfo(tx: any, logger: ApiLogger): { 
  currency: string; 
  issuer: string; 
  value: string; 
} | null {
  const txJson = tx.tx_json;
  const txAmount = txJson.Amount;
  
  let amountInfo: { currency: string; issuer: string; value: string } | null = null;
  
  if (txAmount && typeof txAmount === 'object' && txAmount.currency && txAmount.issuer && txAmount.value) {
    amountInfo = {
      currency: txAmount.currency,
      issuer: txAmount.issuer,
      value: txAmount.value
    };
  } else if (txJson.DeliverMax && typeof txJson.DeliverMax === 'object' && 
             txJson.DeliverMax.currency && txJson.DeliverMax.issuer && txJson.DeliverMax.value) {
    amountInfo = {
      currency: txJson.DeliverMax.currency,
      issuer: txJson.DeliverMax.issuer,
      value: txJson.DeliverMax.value
    };
  } else if (tx.meta?.delivered_amount && typeof tx.meta.delivered_amount === 'object' &&
             tx.meta.delivered_amount.currency && tx.meta.delivered_amount.issuer && 
             tx.meta.delivered_amount.value) {
    amountInfo = {
      currency: tx.meta.delivered_amount.currency,
      issuer: tx.meta.delivered_amount.issuer,
      value: tx.meta.delivered_amount.value
    };
  }
  
  if (!amountInfo) {
    logger.debug('Amount info extraction failed', { 
      txHash: tx.hash,
      amount: txAmount,
      deliverMax: txJson.DeliverMax,
      deliveredAmount: tx.meta?.delivered_amount
    });
    return null;
  }
  
  return amountInfo;
}

// 共通の整合性チェック関数
export async function validateTransactionIntegrity(
  deposit: any, 
  address: string, 
  logger: ApiLogger,
  xrplClient: any
) {
  try {
    logger.info('Starting transaction integrity validation', { uuid: deposit.uuid, address });
    
    // 1. 送金履歴の存在確認（共通関数を使用）
    const userTransactions = await xrplClient.requestAccountTx(address, 200);
    
    // 自身が送金したトランザクションのみをフィルター（Accountが自分となっているTx）
    const outgoingTransactions = userTransactions.filter((tx: any) => {
      const txJson = tx.tx_json;
      const isOutgoing = txJson.Account === address; // 送信元が自分
      
      logger.debug('Transaction filtering', {
        txHash: tx.hash,
        txAccount: txJson.Account,
        userAddress: address,
        isOutgoing: isOutgoing,
        transactionType: txJson.TransactionType
      });
      
      return isOutgoing;
    });
    
    logger.info('Filtered outgoing transactions', {
      totalTransactions: userTransactions.length,
      outgoingTransactions: outgoingTransactions.length,
      userAddress: address
    });
    
    // 送金トランザクションからdepositを検索
    const depositTx = findTransactionByUuid(outgoingTransactions, deposit.uuid, ENCODED_MEMO_TYPE_ID, logger);
    
    if (!depositTx) {
      logger.warn('Deposit transaction not found or invalid memo structure', { 
        uuid: deposit.uuid, 
        address,
        reason: `Transaction not found or MemoType is not "${ENCODED_MEMO_TYPE_ID}"`
      });
      throw new Error(`Deposit transaction not found or invalid memo structure. MemoType must be "${ENCODED_MEMO_TYPE_ID}".`);
    }
    
    // 2. Deposit txから権威的な情報を取得
    const txJson = depositTx.tx_json;
    const destination = txJson.Destination;
    
    logger.debug('Deposit transaction found', { 
      txHash: depositTx.hash, 
      uuid: deposit.uuid,
      transactionResult: depositTx.meta?.TransactionResult,
      txJson: {
        TransactionType: txJson.TransactionType,
        Amount: txJson.Amount,
        DeliverMax: txJson.DeliverMax,
        Account: txJson.Account,
        Destination: txJson.Destination,
        Memos: txJson.Memos
      },
      meta: depositTx.meta ? {
        delivered_amount: depositTx.meta.delivered_amount,
        transaction_result: depositTx.meta.TransactionResult
      } : null
    });
    
    // 3. データの整合性を検証（共通関数を使用）
    logger.debug('Starting amount info extraction', {
      uuid: deposit.uuid,
      txAmount: txJson.Amount,
      hasDeliverMax: !!txJson.DeliverMax,
      hasDeliveredAmount: !!depositTx.meta?.delivered_amount
    });
    
    const amountInfo = extractAmountInfo(depositTx, logger);
    
    if (!amountInfo) {
      logger.warn('Amount info extraction failed - no valid amount found', { 
        uuid: deposit.uuid,
        txJson: txJson
      });
      throw new Error('Invalid amount structure in deposit transaction');
    }
    
    // 4. 通貨コードの詳細ログを即座に出力
    logger.debug('Amount info extracted from deposit tx', {
      uuid: deposit.uuid,
      currency: amountInfo.currency,
      issuer: amountInfo.issuer,
      value: amountInfo.value,
      displayCurrency: Buffer.from(amountInfo.currency, 'hex').toString()  // ← デコード済み通貨コード（画面表示用）
    });
    
    // 5. 通貨コードの検証（bRLUSD設定を使用）
    const brlusdConfig = getBRLUSDConfig();
    const tokenValidation = validateTokenCurrency(brlusdConfig.currency, brlusdConfig.issuer, logger);
    
    if (!tokenValidation.isValid) {
      logger.warn('Token validation failed', { 
        uuid: deposit.uuid,
        expectedCurrency: brlusdConfig.currency,
        expectedIssuer: brlusdConfig.issuer,
        actualCurrency: amountInfo.currency,
        actualIssuer: amountInfo.issuer,
        error: tokenValidation.error
      });
      throw new Error(tokenValidation.error || 'Token validation failed');
    }
    
    logger.info('Token validation successful', {
      uuid: deposit.uuid,
      tokenName: tokenValidation.tokenName,
      displayCurrency: brlusdConfig.displayCurrency,  // ← デコード済み通貨コード（画面表示用）
      encodedCurrency: brlusdConfig.currency,         // ← エンコード済み通貨コード（内部処理用）
      issuer: brlusdConfig.issuer
    });
    
    // 6. ユーザーアドレスの検証
    // depositトランザクションの送信元（Account）が、claim時のDestinationとなるべき
    if (txJson.Account !== address) {
      logger.warn('Address mismatch with original deposit', { 
        expected: address,
        actual: txJson.Account,
        uuid: deposit.uuid
      });
      throw new Error('Address mismatch with original deposit');
    }
    
    // 7. mint履歴での重複チェック（bRLUSD issuerを使用）
    logger.debug('Starting mint history check for duplicate prevention', {
      uuid: deposit.uuid,
      issuer: brlusdConfig.issuer,
      userAddress: address,
      expectedCurrency: brlusdConfig.currency,
      expectedIssuer: brlusdConfig.issuer
    });
    
    const issuerTransactions = await xrplClient.requestAccountTx(brlusdConfig.issuer, 200);
    logger.debug('Issuer transactions fetched', {
      count: issuerTransactions.length,
      issuer: brlusdConfig.issuer
    });
    
    // mintトランザクションをフィルタリング（成功・失敗問わずすべて取得）
    // currencyとissuerの両方を考慮してフィルタリング
    const mintTransactions = issuerTransactions.filter((tx: any) => {
      const mintTxJson = tx.tx_json;
      const isPayment = mintTxJson.TransactionType === 'Payment';
      const isToUser = mintTxJson.Destination === address;
      const isFromIssuer = mintTxJson.Account === brlusdConfig.issuer;
      
      // 通貨コードとissuerの両方をチェック
      const mintAmount = mintTxJson.Amount;
      let isCorrectCurrency = false;
      
      if (typeof mintAmount === 'object' && mintAmount.currency && mintAmount.issuer) {
        isCorrectCurrency = mintAmount.currency === brlusdConfig.currency && 
                           mintAmount.issuer === brlusdConfig.issuer;
      }
      
      const isValidMint = isPayment && isToUser && isFromIssuer && isCorrectCurrency;
      
      if (isValidMint) {
        logger.debug('Valid mint transaction found for filtering', {
          txHash: tx.hash,
          currency: mintAmount?.currency,
          issuer: mintAmount?.issuer,
          expectedCurrency: brlusdConfig.currency,
          expectedIssuer: brlusdConfig.issuer
        });
      }
      
      return isValidMint;
    });
    
    logger.debug('Mint transactions filtered (currency and issuer matched)', { 
      count: mintTransactions.length,
      expectedCurrency: brlusdConfig.currency,
      expectedIssuer: brlusdConfig.issuer
    });
    
    // 各mintトランザクションの詳細をログ出力
    mintTransactions.forEach((tx: any, index: number) => {
      const mintTxJson = tx.tx_json;
      const memo = mintTxJson.Memos?.[0]?.Memo;
      const mintAmount = mintTxJson.Amount;
      
      logger.debug(`Mint transaction ${index + 1} details:`, {
        txHash: tx.hash,
        memo: memo,
        memoType: memo?.MemoType,
        memoData: memo?.MemoData,
        destination: mintTxJson.Destination,
        account: mintTxJson.Account,
        currency: mintAmount?.currency,
        issuer: mintAmount?.issuer,
        transactionResult: tx.meta?.TransactionResult,
        status: isTransactionSuccessful(tx.meta?.TransactionResult) ? 'SUCCESS' : 'FAILED'
      });
    });
    
    const isAlreadyMinted = mintTransactions.some((tx: any) => {
      const mintTxJson = tx.tx_json;
      const memo = mintTxJson.Memos?.[0]?.Memo;
      
      if (!memo) {
        logger.debug('Mint tx has no memo', { txHash: tx.hash });
        return false;
      }
      
      // 共通関数を使用してMemoの整合性チェック
      const validation = validateMemo(memo, ENCODED_MEMO_TYPE_ID, logger);
      logger.debug('Memo validation result', {
        txHash: tx.hash,
        validation: validation,
        targetUuid: deposit.uuid
      });
      
      if (!validation.isValid) {
        logger.debug('Memo validation failed', { 
          txHash: tx.hash, 
          error: validation.error 
        });
        return false;
      }
      
      // 成功したトランザクションのみを重複チェック対象とする
      if (!isTransactionSuccessful(tx.meta?.TransactionResult)) {
        logger.debug('Mint tx failed, not considered for duplicate check', { 
          txHash: tx.hash,
          transactionResult: tx.meta?.TransactionResult
        });
        return false;
      }
      
      const isDuplicate = validation.uuid === deposit.uuid;
      logger.debug('UUID comparison result', {
        txHash: tx.hash,
        memoUuid: validation.uuid,
        targetUuid: deposit.uuid,
        isDuplicate: isDuplicate
      });
      
      return isDuplicate;
    });
    
    if (isAlreadyMinted) {
      logger.warn('Deposit already minted', { 
        uuid: deposit.uuid,
        issuer: brlusdConfig.issuer,
        userAddress: address,
        currency: brlusdConfig.currency
      });
      throw new Error('Deposit already minted');
    }
    
    logger.info('Transaction integrity validation completed successfully', {
      uuid: deposit.uuid,
      userAddress: address,
      currency: amountInfo.currency,
      issuer: amountInfo.issuer,
      amount: amountInfo.value
    });
    
    // 8. 正しいユーザーアドレスを返す（depositトランザクションの送信元）
    return {
      uuid: deposit.uuid,
      userAddress: txJson.Account,        // ← これが正しい：deposit txの送信元アドレス
      currency: brlusdConfig.currency,    // ← bRLUSDの通貨コード
      issuer: brlusdConfig.issuer,        // ← bRLUSDのissuer
      amount: amountInfo.value
    };
    
  } catch (error) {
    logger.error('Transaction integrity validation failed', { 
      uuid: deposit.uuid, 
      address,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// 共通化された関数の使用例とテスト用サンプルコード
/*
## 使用例

### 1. トランザクション成功判定
```typescript
import { isTransactionSuccessful, SUCCESS_RESULT } from '@/lib/transaction-validation';

// 個別判定
const isSuccess = isTransactionSuccessful(tx.meta?.TransactionResult);

// 定数比較
if (tx.meta?.TransactionResult === SUCCESS_RESULT) {
  // 成功時の処理
}
```

### 2. Paymentトランザクションの有効性判定
```typescript
import { isValidPaymentTransaction } from '@/lib/transaction-validation';

const validTransactions = userTransactions.filter(isValidPaymentTransaction);
```

### 3. 通貨コードとissuerの検証
```typescript
import { validateTokenCurrency } from '@/lib/transaction-validation';

const validation = validateTokenCurrency(currency, issuer, logger);
if (validation.isValid) {
  console.log(`Valid token: ${validation.tokenName}`);
} else {
  console.error(`Validation failed: ${validation.error}`);
}
```

### 4. 通貨情報の抽出
```typescript
import { extractAmountInfo } from '@/lib/transaction-validation';

const amountInfo = extractAmountInfo(tx, logger);
if (amountInfo) {
  console.log(`Currency: ${amountInfo.currency}, Amount: ${amountInfo.value}`);
}
```

## テスト用サンプルデータ

### 成功したトランザクション
```typescript
const successfulTx = {
  meta: {
    TransactionResult: 'tesSUCCESS'
  }
};

console.log(isTransactionSuccessful(successfulTx.meta?.TransactionResult)); // true
```

### 失敗したトランザクション
```typescript
const failedTx = {
  meta: {
    TransactionResult: 'tecPATH_DRY'
  }
};

console.log(isTransactionSuccessful(failedTx.meta?.TransactionResult)); // false
```

### 有効なPaymentトランザクション
```typescript
const validPaymentTx = {
  tx_json: {
    TransactionType: 'Payment'
  },
  meta: {
    TransactionResult: 'tesSUCCESS'
  }
};

console.log(isValidPaymentTransaction(validPaymentTx)); // true
```

### 無効なトランザクション
```typescript
const invalidTx = {
  tx_json: {
    TransactionType: 'OfferCreate' // Paymentではない
  },
  meta: {
    TransactionResult: 'tesSUCCESS'
  }
};

console.log(isValidPaymentTransaction(invalidTx)); // false
```
*/
