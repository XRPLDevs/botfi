export function decodeCurrencyCode(hexString: string) {
  // 4文字未満の場合はそのまま返却
  if (hexString.length < 4) {
    return hexString;
  }

  // 16進数をバイト配列に変換
  const bytes = [];
  for (let i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16));
  }

  const ascii = String.fromCharCode(...bytes);

  return ascii.replace(/\0+$/, '');
}

export function encodeCurrencyCode(asciiString: string) {
  // 4文字未満の場合はそのまま返却
  if (asciiString.length < 4) {
    return asciiString;
  }

  // ASCII文字をバイト配列に変換
  const bytes = Array.from(asciiString).map((ch: string) => ch.charCodeAt(0));

  // 20バイト固定にするためゼロパディング（末尾を00で埋める）
  while (bytes.length < 20) {
    bytes.push(0);
  }

  // バイト配列を16進数文字列に変換
  return bytes
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * MemoTypeをXRPL用の16進数形式にエンコード
 * @param memoType - MemoType文字列（例: "id"）
 * @returns エンコードされた16進数文字列
 */
export function encodeMemoType(memoType: string): string {
  // ASCII文字をバイト配列に変換
  const bytes = Array.from(memoType).map((ch: string) => ch.charCodeAt(0));

  // バイト配列を16進数文字列に変換
  return bytes
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * MemoTypeをXRPL用の16進数形式からデコード
 * @param encodedMemoType - エンコードされた16進数文字列
 * @returns デコードされたMemoType文字列
 */
export function decodeMemoType(encodedMemoType: string): string {
  // 16進数をバイト配列に変換
  const bytes = [];
  for (let i = 0; i < encodedMemoType.length; i += 2) {
    bytes.push(parseInt(encodedMemoType.substr(i, 2), 16));
  }

  // バイト配列をASCII文字列に変換
  return String.fromCharCode(...bytes);
}
