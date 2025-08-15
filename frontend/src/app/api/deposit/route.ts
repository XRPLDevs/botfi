import { NextResponse } from 'next/server';
import { XummSdkJwt } from 'xumm-sdk';
import { depositAsset } from '@/app/(app)/_lib/actions';

export async function POST(request: Request, _context: { params: Promise<Record<string, never>> }) {
  try {
    console.log('Deposit API: Starting request processing');

    const authHeader = request.headers.get('authorization');
    console.log('Deposit API: Authorization header present:', !!authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Deposit API: Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwt = authHeader.split(' ')[1];
    console.log('Deposit API: JWT token extracted, length:', jwt.length);

    const xumm = new XummSdkJwt(jwt);

    console.log('Deposit API: Validating JWT with XUMM SDK');
    const appDetails = await xumm.ping();
    const jwtData = appDetails.jwtData as { [key: string]: string };

    if (!jwtData) {
      console.error('Deposit API: Invalid JWT data from XUMM SDK');
      return NextResponse.json({ error: 'Invalid JWT' }, { status: 401 });
    }

    console.log('Deposit API: JWT validation successful, user address:', jwtData.sub);

    // リクエストボディからFormDataを取得
    console.log('Deposit API: Parsing request FormData');
    const formData = await request.formData();

    // FormDataの内容をログ出力
    const formDataEntries = Array.from(formData.entries());
    console.log(
      'Deposit API: FormData entries:',
      formDataEntries.map(([key, value]) => [key, typeof value === 'string' ? value : 'File/Blob'])
    );

    // JWTトークンをFormDataに追加（Server Actionで使用するため）
    formData.append('jwt', jwt);
    console.log('Deposit API: JWT token added to FormData');

    // Server Actionを呼び出し
    console.log('Deposit API: Calling depositAsset Server Action');
    const result = await depositAsset(null, formData);
    console.log('Deposit API: Server Action result:', result);

    if (result.ok) {
      console.log('Deposit API: Success - returning result');
      return NextResponse.json(result);
    } else {
      console.error('Deposit API: Server Action failed:', result.error);
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Deposit API: Unexpected error occurred');
    console.error('Deposit API: Error type:', error?.constructor?.name);
    console.error(
      'Deposit API: Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(
      'Deposit API: Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    console.error('Deposit API: Full error object:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
