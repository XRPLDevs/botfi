import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/wallet.store'
import type { AccountLinesTrustline } from 'xrpl'

interface WalletBalance {
  XRP: string
  RLUSD: string
  BOT: string
}

export function useWalletBalance() {
  const { isConnected, wallet } = useWalletStore()

  return useQuery({
    queryKey: ['walletBalance', wallet.address, wallet.networkType],
    queryFn: async ({ queryKey }: { queryKey: string[] }): Promise<WalletBalance> => {
      const address = queryKey[1]
      const network = queryKey[2]
      if (!address) throw new Error('Address is required')

      try {
        const response = await fetch(`/api/balance?address=${address}&networkType=${network}`)
        
        if (!response.ok) {
          throw new Error('残高の取得に失敗しました')
        }

        const data = await response.json()
        console.log('data: ', data)
        
        if (data.error) {
          throw new Error(data.error)
        }

        // 既存のAPIレスポンスから残高を構築
        const balances: WalletBalance = {
          XRP: '0', // XRP残高は別途取得が必要
          RLUSD: '0',
          BOT: '0'
        }

        // linesからトークン残高を抽出
        if (data.lines && Array.isArray(data.lines)) {
          data.lines.forEach((line: AccountLinesTrustline) => {
            if (line.currency === 'RLUSD') {
              balances.RLUSD = line.balance
            } else if (line.currency === 'BOT') {
              balances.BOT = line.balance
            }
          })
        }

        return balances
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error)
        throw new Error('残高の取得に失敗しました')
      }
    },
    enabled: isConnected && !!wallet.address,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30 * 1000, // 30秒間キャッシュ
    refetchInterval: 60 * 1000, // 1分ごとに自動更新
  })
}
