import type { AccountLinesTrustline } from 'xrpl';
import { cacheTags } from '@/lib/cacheTags';
import { getPrimaryTokenConfigs } from '@/lib/constants';
import { XRPLClient } from '@/lib/xrplClient';
import { decodeCurrencyCode, encodeCurrencyCode } from '@/utils/currency';
import {
  validateJwt,
  createErrorResponse,
  createSuccessResponse,
  ApiLogger,
} from '@/lib/api-utils';

// レスポンス用の型定義
type TrustlineResponse = {
  currency: string;
  displayCurrency: string;
  issuer: string;
  balance: string;
  limit: string;
  isTrust: boolean;
};

export async function GET(request: Request, _context: { params: Promise<Record<string, never>> }) {
  try {
    // JWT認証
    const jwtValidation = await validateJwt(request, 'Trustlines API');
    if (!jwtValidation.success) {
      return createErrorResponse('Trustlines API', null, jwtValidation.status, jwtValidation.error);
    }

    const { address, jwtData } = jwtValidation;

    // XRPLクライアントの初期化
    const xrplClient = new XRPLClient(jwtData.network_endpoint);

    // アカウントのtrustline情報を取得
    const accountLines = await xrplClient.requestAccountLines(address);

    // 既存のtrustlineをマップ（環境変数のissuerアドレスと突合）
    const existingTrustlines = new Map<string, AccountLinesTrustline>();
    for (const line of accountLines) {
      const decodedCurrency = decodeCurrencyCode(line.currency);
      // 環境変数で定義されたissuerアドレスと突合するためのキー
      const key = `${decodedCurrency}_${line.account}`;
      existingTrustlines.set(key, line);
    }

    // 必須トークンを含むtrustlineStatusを作成
    const trustlineStatus: TrustlineResponse[] = getPrimaryTokenConfigs().map(
      ({ currency, displayCurrency, issuer }) => {
        // displayCurrencyを使用して検索キーを生成（XRPL上の実際のcurrency文字列と一致）
        const key = `${displayCurrency}_${issuer}`;
        const existingLine = existingTrustlines.get(key);

        if (existingLine && existingLine.limit !== '0' && existingLine.limit !== '0.000000') {
          // 環境変数のissuerアドレスと完全に一致するtrustlineがあり、limitが0でない場合
          return {
            currency: existingLine.currency, // 元の16進数
            displayCurrency: decodeCurrencyCode(existingLine.currency), // currency.ts内で制御される
            issuer: existingLine.account,
            balance: existingLine.balance,
            limit: existingLine.limit,
            isTrust: true,
          };
        } else {
          // 環境変数のissuerアドレスと一致するtrustlineがない、またはlimitが0の場合
          return {
            currency: encodeCurrencyCode(currency), // currency.ts内で制御される
            displayCurrency: currency, // getPrimaryTokenConfigsのASCII文字列
            issuer,
            balance: existingLine?.balance || '0',
            limit: existingLine?.limit || '0',
            isTrust: false,
          };
        }
      }
    );

    // 必須トークンのみを返す
    const allTrustlines = [...trustlineStatus];

    return createSuccessResponse(allTrustlines, cacheTags.trustline);
  } catch (error) {
    return createErrorResponse('Trustlines API', error);
  }
}
