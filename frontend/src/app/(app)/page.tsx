import Image from 'next/image';

import AssetTableContainer from '@/app/(app)/_containers/asset-table/container';
import RefreshButtonContainer from '@/app/(app)/_containers/refresh-button/container';
import WalletConnectMessageContainer from '@/app/(app)/_containers/wallet-connect-message/container';

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <WalletConnectMessageContainer>
          <div className="flex flex-col gap-4 w-full">
            {/* Refreshボタンを上部に配置 */}
            <div className="flex justify-end">
              <RefreshButtonContainer />
            </div>
            <AssetTableContainer />
          </div>
        </WalletConnectMessageContainer>
      </main>
    </div>
  );
}
