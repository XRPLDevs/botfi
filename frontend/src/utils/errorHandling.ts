/**
 * エラーハンドリングの共通ユーティリティ
 */

/**
 * エラーメッセージを統一された形式で取得
 * @param error - エラーオブジェクト
 * @param defaultMessage - デフォルトのエラーメッセージ
 * @returns 統一されたエラーメッセージ
 */
export const getErrorMessage = (error: unknown, defaultMessage: string = '不明なエラーが発生しました'): string => {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return defaultMessage
}

/**
 * エラーログの出力とエラーメッセージの取得
 * @param error - エラーオブジェクト
 * @param context - エラーが発生したコンテキスト
 * @param defaultMessage - デフォルトのエラーメッセージ
 * @returns 統一されたエラーメッセージ
 */
export const handleError = (
  error: unknown, 
  context: string, 
  defaultMessage: string = '不明なエラーが発生しました'
): string => {
  const errorMessage = getErrorMessage(error, defaultMessage)
  console.error(`${context}:`, error)
  return errorMessage
}
