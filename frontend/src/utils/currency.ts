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
