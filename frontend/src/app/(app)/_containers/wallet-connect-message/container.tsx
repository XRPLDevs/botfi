'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletConnectMessage } from './presentational';

type WalletConnectMessageContainerProps = {
  children: React.ReactNode;
};

export default function WalletConnectMessageContainer({
  children,
}: WalletConnectMessageContainerProps) {
  const { isConnected } = useWallet();
  const [showSplash, setShowSplash] = useState(true);

  // スプラッシュ画面を1.5秒間表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // スプラッシュ画面表示中は常にスプラッシュを表示
  if (showSplash) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-foreground animate-in fade-in duration-1000">
            BotFi
          </h1>
        </div>
      </div>
    );
  }

  // スプラッシュ画面表示完了後、ウォレットが接続されていない場合は接続促進メッセージを表示
  if (!isConnected) {
    return <WalletConnectMessage />;
  }

  // 接続されている場合は子コンポーネントを表示
  return <>{children}</>;
}
