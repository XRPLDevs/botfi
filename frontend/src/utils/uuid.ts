/**
 * UUIDの16進数エンコード/デコード用ユーティリティ関数
 * XRPLのMemosフィールドで使用するための変換処理
 */

/**
 * UUIDを16進数文字列にエンコード
 * @param uuid - エンコードするUUID文字列
 * @returns 16進数文字列
 */
export function encodeUuid(uuid: string): string {
  // UUIDからハイフンを除去
  const cleanUuid = uuid.replace(/-/g, '');

  // 16進数文字列に変換
  return cleanUuid;
}

/**
 * 16進数文字列をUUIDにデコード
 * @param hexString - デコードする16進数文字列
 * @returns UUID文字列
 */
export function decodeUuid(hexString: string): string {
  // 16進数文字列をUUID形式に変換
  const uuid = hexString.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
  return uuid;
}

/**
 * 文字列を16進数文字列にエンコード
 * @param text - エンコードする文字列
 * @returns 16進数文字列
 */
export function encodeTextToHex(text: string): string {
  return Buffer.from(text, 'utf8').toString('hex');
}

/**
 * 16進数文字列を文字列にデコード
 * @param hexString - デコードする16進数文字列
 * @returns 文字列
 */
export function decodeHexToText(hexString: string): string {
  return Buffer.from(hexString, 'hex').toString('utf8');
}

/**
 * UUIDを検証
 * @param uuid - 検証するUUID文字列
 * @returns 有効なUUIDかどうか
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
