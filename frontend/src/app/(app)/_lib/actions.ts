'use server';

import { revalidateTag } from 'next/cache';
import { XummSdkJwt } from 'xumm-sdk';
import { z } from 'zod';
import { encodeCurrencyCode } from '@/utils/currency';
import type { DepositResponse, TrustlineSetResponse } from '../_containers/asset-table/types';

// トラストライン設定用のスキーマ
const TrustlineSetSchema = z.object({
  currency: z.string().min(1),
  issuer: z.string().min(1),
  limit: z.string().regex(/^\d+(\.\d+)?$/),
});

// Deposit用のPaymentトランザクション処理用のスキーマ
const DepositSchema = z.object({
  currency: z.string().min(1),
  issuer: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  destination: z.string().min(1),
});

export async function setTrustline(_: unknown, formData: FormData): Promise<TrustlineSetResponse> {
  try {
    // フォームデータから値を取得
    const input = {
      currency: formData.get('currency') as string,
      issuer: formData.get('issuer') as string,
      limit: formData.get('limit') as string,
    };

    // スキーマで検証
    const parsed = TrustlineSetSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: 'Invalid input data' };
    }

    // JWTトークンを取得（実際の実装では適切な認証処理が必要）
    const jwt = formData.get('jwt') as string;
    if (!jwt) {
      return { ok: false, error: 'Authentication required' };
    }

    // XUMM SDKでトランザクションを送信
    const xumm = new XummSdkJwt(jwt);

    // 通貨コードをXRPL用に16進数エンコード
    const encodedCurrency = encodeCurrencyCode(parsed.data.currency);

    // トラストライン設定トランザクションのペイロードを作成
    const payload = {
      txjson: {
        TransactionType: 'TrustSet',
        Flags: 0,
        LimitAmount: {
          currency: encodedCurrency,
          issuer: parsed.data.issuer,
          value: parsed.data.limit,
        },
      } as const,
    };

    // トランザクションを送信
    const result = await xumm.payload.create(payload);

    if (result?.uuid) {
      // 成功時はキャッシュを再検証
      revalidateTag('trustline');
      return {
        ok: true,
        txHash: result.uuid,
        signUrl: result.next?.always, // 署名用URLを追加
      };
    } else {
      return { ok: false, error: 'Failed to create transaction' };
    }
  } catch (error) {
    console.error('Trustline set error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Deposit用のPaymentトランザクション処理
export async function depositAsset(_: unknown, formData: FormData): Promise<DepositResponse> {
  try {
    console.log('Deposit Action: Starting depositAsset function');

    // フォームデータから値を取得
    const input = {
      currency: formData.get('currency') as string,
      issuer: formData.get('issuer') as string,
      amount: formData.get('amount') as string,
      destination: formData.get('destination') as string,
    };

    console.log('Deposit Action: Extracted input data:', input);

    // スキーマで検証
    console.log('Deposit Action: Validating input with schema');
    const parsed = DepositSchema.safeParse(input);
    if (!parsed.success) {
      console.error('Deposit Action: Schema validation failed:', parsed.error);
      return { ok: false, error: 'Invalid input data' };
    }

    console.log('Deposit Action: Schema validation successful');

    // JWTトークンを取得（実際の実装では適切な認証処理が必要）
    const jwt = formData.get('jwt') as string;
    if (!jwt) {
      console.error('Deposit Action: JWT token missing from FormData');
      return { ok: false, error: 'Authentication required' };
    }

    console.log('Deposit Action: JWT token found, length:', jwt.length);

    // XUMM SDKでトランザクションを送信
    console.log('Deposit Action: Creating XUMM SDK instance');
    const xumm = new XummSdkJwt(jwt);

    // 通貨コードをXRPL用に16進数エンコード
    console.log('Deposit Action: Encoding currency code:', parsed.data.currency);
    const encodedCurrency = encodeCurrencyCode(parsed.data.currency);
    console.log('Deposit Action: Encoded currency:', encodedCurrency);

    // Paymentトランザクションのペイロードを作成
    const payload = {
      txjson: {
        TransactionType: 'Payment',
        Flags: 0,
        Destination: parsed.data.destination,
        Amount: {
          currency: encodedCurrency,
          issuer: parsed.data.issuer,
          value: parsed.data.amount,
        },
      } as const,
    };

    console.log('Deposit Action: Created transaction payload:', JSON.stringify(payload, null, 2));

    // トランザクションを送信
    console.log('Deposit Action: Sending transaction to XUMM');
    const result = await xumm.payload.create(payload);
    console.log('Deposit Action: XUMM response:', result);

    if (result?.uuid) {
      // 成功時はキャッシュを再検証
      console.log('Deposit Action: Transaction created successfully, revalidating cache');
      revalidateTag('deposit');
      return {
        ok: true,
        txHash: result.uuid,
        signUrl: result.next?.always, // 署名用URLを追加
      };
    } else {
      console.error('Deposit Action: Failed to create transaction, no UUID in response');
      return { ok: false, error: 'Failed to create deposit transaction' };
    }
  } catch (error) {
    console.error('Deposit Action: Unexpected error occurred');
    console.error('Deposit Action: Error type:', error?.constructor?.name);
    console.error(
      'Deposit Action: Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(
      'Deposit Action: Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    console.error('Deposit Action: Full error object:', error);

    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
