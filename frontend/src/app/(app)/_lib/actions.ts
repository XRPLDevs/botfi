'use server'

import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { XummSdkJwt } from 'xumm-sdk'
import { encodeCurrencyCode } from '@/utils/currency'
import type { TrustlineSetRequest, TrustlineSetResponse } from '../_containers/asset-table/types'

// トラストライン設定用のスキーマ
const TrustlineSetSchema = z.object({
  currency: z.string().min(1),
  issuer: z.string().min(1),
  limit: z.string().regex(/^\d+(\.\d+)?$/),
})

export async function setTrustline(
  _: unknown,
  formData: FormData
): Promise<TrustlineSetResponse> {
  try {
    // フォームデータから値を取得
    const input = {
      currency: formData.get('currency') as string,
      issuer: formData.get('issuer') as string,
      limit: formData.get('limit') as string,
    }

    // スキーマで検証
    const parsed = TrustlineSetSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: 'Invalid input data' }
    }

    // JWTトークンを取得（実際の実装では適切な認証処理が必要）
    const jwt = formData.get('jwt') as string
    if (!jwt) {
      return { ok: false, error: 'Authentication required' }
    }

    // XUMM SDKでトランザクションを送信
    const xumm = new XummSdkJwt(jwt)
    
    // 通貨コードをXRPL用に16進数エンコード
    const encodedCurrency = encodeCurrencyCode(parsed.data.currency)
    
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
    }

    // トランザクションを送信
    const result = await xumm.payload.create(payload)
    
    if (result && result.uuid) {
      // 成功時はキャッシュを再検証
      revalidateTag('trustline')
      return { 
        ok: true, 
        txHash: result.uuid,
        signUrl: result.next?.always // 署名用URLを追加
      }
    } else {
      return { ok: false, error: 'Failed to create transaction' }
    }

  } catch (error) {
    console.error('Trustline set error:', error)
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}
