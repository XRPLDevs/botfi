import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'xrpl'
import { getNetworkUrl, validateNetworkType, getNetworkConfig } from '@/config/constants'

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
  
  // ネットワーク設定からBOT_ISSUERを取得
  const networkConfig = getNetworkConfig(networkType)

  try {
    await client.connect()

    const account = await client.request({
      command: 'account_lines',
      account: address ?? '',
    })

    const lines = account.result.lines
    const botLine = lines.find((line: any) => line.currency === 'BOT' && line.account === networkConfig.BOT_ISSUER && line.limit !== '0')

    return NextResponse.json({
      isTrustline: botLine ? true : false,
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
