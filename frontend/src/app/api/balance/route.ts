import { NextRequest, NextResponse } from 'next/server'
import { Client, type AccountLinesTrustline } from 'xrpl'
import { getNetworkUrl, validateNetworkType } from '@/config/constants'

// 通貨コードのデコード関数
function decodeCurrency(hexCurrency: string): string {
  // hex文字列を2文字ずつ分割して、ASCII文字に変換
  const bytes = hexCurrency.match(/.{1,2}/g) || []
  let decoded = ''
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(bytes[i], 16)
    // null文字（0x00）で終端された場合、それ以降は無視
    if (byte === 0) break
    // ASCII文字として追加
    decoded += String.fromCharCode(byte)
  }
  
  return decoded
}

// 既知の通貨コードのマッピング（必要に応じて拡張可能）
const KNOWN_CURRENCIES: Record<string, string> = {
  '524C555344000000000000000000000000000000': 'RLUSD', // RLUSD
  '42544F0000000000000000000000000000000000': 'BOT',   // BOT
  // 他の通貨コードもここに追加可能
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const networkType = searchParams.get('networkType') || 'testnet'

  // ネットワークタイプの検証
  if (!validateNetworkType(networkType)) {
    return NextResponse.json(
      { error: 'Invalid network type' },
      { status: 400 }
    )
  }

  const client = new Client(getNetworkUrl(networkType))
  
  try {
    await client.connect()

    const account = await client.request({
      command: 'account_lines',
      account: address ?? '',
    })

    const lines: AccountLinesTrustline[] = account.result.lines

    // 通貨コードを適切にデコード
    const decodedLines = lines.map((line) => {
      let decodedCurrency = line.currency
      
      // 既知の通貨コードの場合は直接マッピング
      if (KNOWN_CURRENCIES[line.currency]) {
        decodedCurrency = KNOWN_CURRENCIES[line.currency]
      } else if (line.currency.length === 40) {
        // 40文字のhex文字列の場合、デコードを試行
        const decoded = decodeCurrency(line.currency)
        if (decoded && decoded.length > 0) {
          decodedCurrency = decoded
        }
      }
      
      return {
        ...line,
        currency: decodedCurrency
      }
    })

    return NextResponse.json({
      lines: decodedLines,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({
      isTrustline: false,
    })
  } finally {
    await client.disconnect()
  }
}
