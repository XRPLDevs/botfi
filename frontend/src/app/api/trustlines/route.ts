import { NextResponse } from 'next/server';
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
import { isTransactionSuccessful } from '@/lib/transaction-validation';

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
  const logger = new ApiLogger('Trustlines API');

  try {
    logger.info('Starting request processing');

    // JWT認証
    const jwtValidation = await validateJwt(request, 'Trustlines API');
    if (!jwtValidation.success) {
      logger.warn('JWT validation failed', { error: jwtValidation.error });
      return createErrorResponse('Trustlines API', null, jwtValidation.status, jwtValidation.error);
    }

    const { address, jwtData } = jwtValidation;
    logger.info('JWT validation successful', { address });

    // XRPLクライアントの初期化
    const xrplClient = new XRPLClient(jwtData.network_endpoint);
    logger.debug('XRPL client initialized', { networkEndpoint: jwtData.network_endpoint });

    // アカウントのtrustline情報を取得
    logger.debug('Fetching account lines', { address });
    const accountLines = await xrplClient.requestAccountLines(address);
    logger.info('Account lines fetched', { count: accountLines.length });

    // 既存のtrustlineをマップ（currency.ts内で制御される）
    const existingTrustlines = new Map<string, AccountLinesTrustline>();
    for (const line of accountLines) {
      const decodedCurrency = decodeCurrencyCode(line.currency);
      const key = `${decodedCurrency}_${line.account}`;
      existingTrustlines.set(key, line);
    }

    logger.debug('Existing trustlines mapped', { count: existingTrustlines.size });

    // 必須トークンを含むtrustlineStatusを作成
    const trustlineStatus: TrustlineResponse[] = getPrimaryTokenConfigs().map(
      ({ currency, issuer }) => {
        const key = `${currency}_${issuer}`;
        const existingLine = existingTrustlines.get(key);

        if (existingLine && existingLine.limit !== '0' && existingLine.limit !== '0.000000') {
          // 既存のtrustlineがあり、limitが0でない場合
          return {
            currency: existingLine.currency, // 元の16進数
            displayCurrency: decodeCurrencyCode(existingLine.currency), // currency.ts内で制御される
            issuer: existingLine.account,
            balance: existingLine.balance,
            limit: existingLine.limit,
            isTrust: true,
          };
        } else {
          // 既存のtrustlineがない、またはlimitが0の場合
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

    // その他のトークンも追加（オプション）
    const otherTrustlines = accountLines
      .filter(
        (line) =>
          !getPrimaryTokenConfigs().some((required) => {
            const decodedCurrency = decodeCurrencyCode(line.currency);
            return required.currency === decodedCurrency && required.issuer === line.account;
          })
      )
      .map((line) => ({
        currency: line.currency, // 元の16進数
        displayCurrency: decodeCurrencyCode(line.currency), // currency.ts内で制御される
        issuer: line.account,
        balance: line.balance,
        limit: line.limit,
        isTrust: line.limit !== '0' && line.limit !== '0.000000',
      }));

    // 必須トークン + その他のトークンを結合
    const allTrustlines = [...trustlineStatus, ...otherTrustlines];

    logger.info('Trustlines processed successfully', {
      primaryTokens: trustlineStatus.length,
      otherTokens: otherTrustlines.length,
      total: allTrustlines.length,
    });

    return createSuccessResponse(allTrustlines, cacheTags.trustline);
  } catch (error) {
    logger.error('Unexpected error occurred', error);
    return createErrorResponse('Trustlines API', error);
  }
}
