import { NextResponse } from 'next/server';
import type { AccountLinesTrustline } from 'xrpl';
import { XummSdkJwt } from 'xumm-sdk';
import { cacheTags } from '@/lib/cacheTags';
import { getPrimaryTokenConfigs } from '@/lib/constants';
import { XRPLClient } from '@/lib/xrplClient';
import { decodeCurrencyCode, encodeCurrencyCode } from '@/utils/currency';

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
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwt = authHeader.split(' ')[1];

    const xumm = new XummSdkJwt(jwt);

    const appDetails = await xumm.ping();
    const jwtData = appDetails.jwtData as { [key: string]: string };

    if (!jwtData) {
      return NextResponse.json({ error: 'Invalid JWT' }, { status: 401 });
    }

    const address = jwtData.sub;

    const xrplClient = new XRPLClient(jwtData.network_endpoint);
    const accountLines = await xrplClient.requestAccountLines(address);

    // 既存のtrustlineをマップ（currency.ts内で制御される）
    const existingTrustlines = new Map<string, AccountLinesTrustline>();
    for (const line of accountLines) {
      const decodedCurrency = decodeCurrencyCode(line.currency);
      const key = `${decodedCurrency}_${line.account}`;
      existingTrustlines.set(key, line);
    }

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

    // キャッシュタグをヘッダーに追加
    const response = NextResponse.json(allTrustlines);
    response.headers.set('Cache-Tag', cacheTags.trustline);

    return response;
  } catch (error) {
    console.error('Trustlines API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
