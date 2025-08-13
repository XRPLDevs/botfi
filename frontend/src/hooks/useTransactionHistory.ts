import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/wallet.store'

export function useTransactionHistory() {
  const { isConnected, wallet } = useWalletStore()

  return useQuery({
    queryKey: ['transactionHistory', wallet.address, wallet.networkType],
    queryFn: async ({ queryKey }: { queryKey: string[] }): Promise<any[]> => {
      const address = queryKey[1]
      const network = queryKey[2]
      if (!address) throw new Error('Address is required')

      // 実際の実装では、XRPLのaccount_tx APIを呼び出してトランザクション履歴を取得
      // ここではプレースホルダーとして空の配列を返す
      return []
    },
    enabled: isConnected && !!wallet.address,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  })
}
