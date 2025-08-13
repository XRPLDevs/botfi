'use client'

import { useCallback, useMemo, lazy, Suspense } from 'react'
import { useWalletStore } from '@/stores/wallet.store'
import { useTrustline } from '@/hooks/useTrustline'
import PageContainer from '@/components/layout/PageContainer'
import WalletConnectionPrompt from '@/app/_components/sections/WalletConnectionPrompt'
import TrustlineStatusChecker from '@/app/_components/sections/TrustlineStatusChecker'

// 遅延読み込みでコンポーネントを最適化
const TrustlineNoSetSection = lazy(() => import('@/app/_components/sections/TrustlineNoSetSection'))
const TrustlineSetSection = lazy(() => import('@/app/_components/sections/TrustlineSetSection'))

export default function Home() {
  const { isConnected, wallet } = useWalletStore()
  const trustlineQuery = useTrustline()

  // リトライ関数をメモ化
  const handleRetry = useCallback(() => {
    trustlineQuery.refetch()
  }, [trustlineQuery])

  // 空のリトライ関数をメモ化
  const handleEmptyRetry = useCallback(() => {
    // 何もしない
  }, [])

  // レンダリングするコンポーネントをメモ化（レンダリング最適化）
  const mainContent = useMemo(() => {
    // 1. ウォレット未接続
    if (!isConnected) {
      return <WalletConnectionPrompt />
    }

    // 2. Trustline状態確認中
    if (trustlineQuery.isLoading) {
      return (
        <TrustlineStatusChecker 
          isLoading={true} 
          isError={false} 
          onRetry={handleEmptyRetry} 
        />
      )
    }

    // 3. Trustline状態確認エラー
    if (trustlineQuery.isError) {
      return (
        <TrustlineStatusChecker 
          isLoading={false} 
          isError={true} 
          onRetry={handleRetry} 
        />
      )
    }

    // 4. Trustline設定済み
    if (trustlineQuery.data) {
      return (
        <Suspense fallback={<TrustlineStatusChecker isLoading={true} isError={false} onRetry={handleEmptyRetry} />}>
          <TrustlineSetSection wallet={wallet} />
        </Suspense>
      )
    }

    // 5. Trustline未設定
    return (
      <Suspense fallback={<TrustlineStatusChecker isLoading={true} isError={false} onRetry={handleEmptyRetry} />}>
        <TrustlineNoSetSection wallet={wallet} />
      </Suspense>
    )
  }, [isConnected, wallet, trustlineQuery.isLoading, trustlineQuery.isError, trustlineQuery.data, handleRetry, handleEmptyRetry])

  return (
    <PageContainer>
      {mainContent}
    </PageContainer>
  )
}
