import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/wallet.store'

export function useTrustline() {
  const { isConnected, wallet } = useWalletStore()

  return useQuery({
    queryKey: ['trustline', wallet.address, wallet.networkType],
    queryFn: async ({ queryKey }: { queryKey: string[] }): Promise<boolean> => {
      const address = queryKey[1]
      const network = queryKey[2]
      if (!address) throw new Error('Address is required')

      const response = await fetch(`/api/trustline?address=${address}&networkType=${network}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      return data.isTrustline
    },
    enabled: isConnected && !!wallet.address,
    retry: false, // 接続エラー時の再試行を無効化
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  })
}
