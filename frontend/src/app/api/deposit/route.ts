import { NextResponse } from 'next/server';
import { depositAsset } from '@/app/(app)/_lib/actions';
import { validateJwt, createErrorResponse, createSuccessResponse, ApiLogger, parseFormData } from '@/lib/api-utils';

export async function POST(request: Request, _context: { params: Promise<Record<string, never>> }) {
  const logger = new ApiLogger('Deposit API');
  
  try {
    logger.info('Starting request processing');

    // JWT認証
    const jwtValidation = await validateJwt(request, 'Deposit API');
    if (!jwtValidation.success) {
      logger.warn('JWT validation failed', { error: jwtValidation.error });
      return createErrorResponse('Deposit API', null, jwtValidation.status, jwtValidation.error);
    }

    const { jwt, address } = jwtValidation;
    logger.info('JWT validation successful', { address });

    // FormData解析
    const formData = await parseFormData(request, 'Deposit API');
    
    // JWTトークンをFormDataに追加（Server Actionで使用するため）
    formData.append('jwt', jwt);
    logger.debug('JWT token added to FormData');

    // Server Actionを呼び出し
    logger.info('Calling depositAsset Server Action');
    const result = await depositAsset(null, formData);
    logger.info('Server Action completed', { success: result.ok });

    if (result.ok) {
      logger.info('Success - returning result');
      return createSuccessResponse(result);
    } else {
      logger.warn('Server Action failed', { error: result.error });
      return createErrorResponse('Deposit API', null, 400, result.error);
    }
  } catch (error) {
    logger.error('Unexpected error occurred', error);
    return createErrorResponse('Deposit API', error);
  }
}
