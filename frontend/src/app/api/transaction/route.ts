import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'xrpl'
import { getNetworkUrl, validateNetworkType } from '@/utils/networks'

export async function POST(request: NextRequest) {
  try {
    const { transaction, networkType } = await request.json()

    console.log('transaction: ', transaction)
    console.log('networkType: ', networkType)

    // 必須パラメータの検証
    if (!transaction || !networkType) {
      return NextResponse.json(
        { error: 'Missing required parameters: transaction and networkType' },
        { status: 400 }
      )
    }

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

      const result = await client.submitAndWait(transaction)

      if (result.type !== 'response') {
        throw new Error(`Transaction submission failed: ${result.type}`)
      }

      console.log(`Transaction submitted successfully: ${result.result.hash}`)

      return NextResponse.json({ 
        result: result.result,
        hash: result.result.hash,
        message: 'Transaction submitted successfully'
      })
    } finally {
      await client.disconnect()
    }
  } catch (error) {
    console.error('Transaction API error:', error)
    
    // エラーメッセージの詳細化
    let errorMessage = 'Transaction failed'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
