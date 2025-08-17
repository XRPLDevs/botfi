'use server';

import { revalidateTag } from 'next/cache';
import { XummSdkJwt } from 'xumm-sdk';
import { z } from 'zod';
import { encodeCurrencyCode } from '@/utils/currency';
import { encodeUuid } from '@/utils/uuid';
import {
  MEMO_TYPE_ID,
  ENCODED_MEMO_TYPE_ID,
  ENCODED_MEMO_FORMAT_TEXT_PLAIN,
} from '@/utils/memo-validation';
import type {
  DepositResponse,
  TrustlineSetResponse,
  ClaimResponse,
} from '../_containers/asset-table/types';

// 共通のスキーマ
const CommonSchema = {
  currency: z.string().min(1),
  issuer: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  destination: z.string().min(1),
  limit: z.string().regex(/^\d+(\.\d+)?$/),
  uuid: z.string().min(1),
  userAddress: z.string().min(1),
} as const;

// トラストライン設定用のスキーマ
const TrustlineSetSchema = z.object({
  currency: CommonSchema.currency,
  issuer: CommonSchema.issuer,
  limit: CommonSchema.limit,
});

// Deposit用のPaymentトランザクション処理用のスキーマ
const DepositSchema = z.object({
  currency: CommonSchema.currency,
  issuer: CommonSchema.issuer,
  amount: CommonSchema.amount,
  destination: CommonSchema.destination,
});

// Claim用のPaymentトランザクション処理用のスキーマ
const ClaimSchema = z.object({
  currency: CommonSchema.currency,
  issuer: CommonSchema.issuer,
  amount: CommonSchema.amount,
  uuid: CommonSchema.uuid,
  userAddress: CommonSchema.userAddress,
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

    const noRippleFlag = 131072

    // トラストライン設定トランザクションのペイロードを作成
    const payload = {
      txjson: {
        TransactionType: 'TrustSet',
        Flags: noRippleFlag,
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
    // フォームデータから値を取得
    const input = {
      currency: formData.get('currency') as string,
      issuer: formData.get('issuer') as string,
      amount: formData.get('amount') as string,
      destination: formData.get('destination') as string,
    };

    // スキーマで検証
    const parsed = DepositSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: 'Invalid input data' };
    }

    // JWTトークンを取得
    const jwt = formData.get('jwt') as string;
    if (!jwt) {
      return { ok: false, error: 'Authentication required' };
    }

    // XUMM SDKでトランザクションを送信
    const xumm = new XummSdkJwt(jwt);

    // 通貨コードをXRPL用に16進数エンコード
    const encodedCurrency = encodeCurrencyCode(parsed.data.currency);

    // UUIDを生成して16進数エンコード
    const uuid = crypto.randomUUID();
    const encodedUuid = encodeUuid(uuid);

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
        Memos: [
          {
            Memo: {
              MemoType: ENCODED_MEMO_TYPE_ID, // "id" in hex
              MemoFormat: ENCODED_MEMO_FORMAT_TEXT_PLAIN, // "text/plain" in hex
              MemoData: encodedUuid, // UUID in hex
            },
          },
        ],
      } as const,
    };

    // トランザクションを送信
    const result = await xumm.payload.create(payload);

    if (result?.uuid) {
      // 成功時はキャッシュを再検証
      revalidateTag('deposit');
      return {
        ok: true,
        txHash: result.uuid,
        signUrl: result.next?.always,
      };
    } else {
      return { ok: false, error: 'Failed to create deposit transaction' };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Claim用のPaymentトランザクション処理
export async function claimAsset(_: unknown, formData: FormData): Promise<ClaimResponse> {
  try {
    // フォームデータから値を取得
    const input = {
      currency: formData.get('currency') as string,
      issuer: formData.get('issuer') as string,
      amount: formData.get('amount') as string,
      uuid: formData.get('uuid') as string,
      userAddress: formData.get('userAddress') as string,
    };

    // スキーマで検証
    const parsed = ClaimSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: 'Invalid input data' };
    }

    // JWTトークンを取得
    const jwt = formData.get('jwt') as string;
    if (!jwt) {
      return { ok: false, error: 'Authentication required' };
    }

    // XUMM SDKでトランザクションを送信
    const xumm = new XummSdkJwt(jwt);

    // 通貨コードをXRPL用に16進数エンコード
    const encodedCurrency = encodeCurrencyCode(parsed.data.currency);

    // UUIDを16進数エンコード
    const encodedUuid = encodeUuid(parsed.data.uuid);

    // Paymentトランザクションのペイロードを作成（mint処理）
    const payload = {
      txjson: {
        TransactionType: 'Payment',
        Flags: 0,
        Destination: parsed.data.userAddress,
        Amount: {
          currency: encodedCurrency,
          issuer: parsed.data.issuer,
          value: parsed.data.amount,
        },
        Memos: [
          {
            Memo: {
              MemoType: ENCODED_MEMO_TYPE_ID, // "id" in hex
              MemoFormat: ENCODED_MEMO_FORMAT_TEXT_PLAIN, // "text/plain" in hex
              MemoData: encodedUuid,
            },
          },
        ],
      } as const,
    };

    // トランザクションを送信
    const result = await xumm.payload.create(payload);

    if (result?.uuid) {
      // 成功時はキャッシュを再検証
      revalidateTag('claim');
      return {
        ok: true,
        txHash: result.uuid,
        signUrl: result.next?.always,
      };
    } else {
      return { ok: false, error: 'Failed to create claim transaction' };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
