import { useMutation } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/wallet.store'

export function useTxSubmit() {
  const { wallet } = useWalletStore()

  return useMutation({
    mutationFn: async (transaction: string): Promise<void> => {
      if (!transaction) throw new Error('Transaction is required')

      const response = await fetch(`/api/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction, networkType: wallet.networkType }),
      })
      const data = await response.json()
      return data
    },
    onSuccess: (data) => {
      console.log('Transaction submitted successfully:', data)
      // 成功時の処理（例：トースト表示、画面遷移など）
    },
    onError: (error) => {
      console.error('Transaction failed:', error)
      // エラー時の処理（例：エラーメッセージ表示など）
    }
  })
}
