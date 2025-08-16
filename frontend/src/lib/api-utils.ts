import { NextResponse } from 'next/server';
import { XummSdkJwt } from 'xumm-sdk';

// API共通の型定義
export type ApiContext = {
  apiName: string;
  request: Request;
};

export type JwtValidationResult =
  | {
      success: true;
      jwt: string;
      jwtData: { [key: string]: string };
      address: string;
    }
  | {
      success: false;
      error: string;
      status: number;
    };

// JWT認証の共通処理
export async function validateJwt(request: Request, apiName: string): Promise<JwtValidationResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Unauthorized',
      status: 401,
    };
  }

  const jwt = authHeader.split(' ')[1];

  try {
    const xumm = new XummSdkJwt(jwt);
    const appDetails = await xumm.ping();
    const jwtData = appDetails.jwtData as { [key: string]: string };

    if (!jwtData) {
      return {
        success: false,
        error: 'Invalid JWT',
        status: 401,
      };
    }

    return {
      success: true,
      jwt,
      jwtData,
      address: jwtData.sub,
    };
  } catch (error) {
    return {
      success: false,
      error: 'JWT validation failed',
      status: 401,
    };
  }
}

// エラーレスポンスの共通処理
export function createErrorResponse(
  apiName: string,
  error: unknown,
  status: number = 500,
  customMessage?: string
): NextResponse {
  const errorMessage = customMessage || 'Internal server error';
  const errorDetails = error instanceof Error ? error.message : 'Unknown error';

  console.error(`${apiName}: ${errorMessage}`, {
    error: errorDetails,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      ok: false,
      error: errorMessage,
      details: errorDetails,
    },
    { status }
  );
}

// 成功レスポンスの共通処理
export function createSuccessResponse(data: any, cacheTag?: string): NextResponse {
  const response = NextResponse.json(data);

  if (cacheTag) {
    response.headers.set('Cache-Tag', cacheTag);
  }

  return response;
}

// ログ出力の共通化
export class ApiLogger {
  private apiName: string;

  constructor(apiName: string) {
    this.apiName = apiName;
  }

  info(message: string, data?: any) {
    // console.log removed for production
  }

  warn(message: string, data?: any) {
    console.warn(`${this.apiName}: ${message}`, data || '');
  }

  error(message: string, error?: any) {
    console.error(`${this.apiName}: ${message}`, error || '');
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      // console.log removed for production
    }
  }
}

// FormData処理の共通化
export async function parseFormData(request: Request, apiName: string) {
  try {
    const formData = await request.formData();
    const entries = Array.from(formData.entries());

    // 機密情報を除いたログ出力
    const safeEntries = entries.map(([key, value]) => [
      key,
      key.toLowerCase().includes('jwt') || key.toLowerCase().includes('token')
        ? '[REDACTED]'
        : typeof value === 'string'
          ? value
          : 'File/Blob',
    ]);

    // console.log removed for production

    return formData;
  } catch (error) {
    console.error(`${apiName}: Failed to parse FormData`, error);
    throw new Error('Invalid form data');
  }
}
