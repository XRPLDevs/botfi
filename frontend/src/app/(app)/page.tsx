import AssetTableContainer from '@/app/(app)/_containers/asset-table/container';
import RefreshButtonContainer from '@/app/(app)/_containers/refresh-button/container';
import WalletConnectMessageContainer from '@/app/(app)/_containers/wallet-connect-message/container';
import Link from 'next/link';

const appStatus = process.env.NEXT_PUBLIC_APP_STATUS;

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {appStatus === 'developing' && (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">Coming Soon</h2>
              <p className="text-lg text-muted-foreground max-w-md">
                Revolutionary features are about to launch!
                <br />
                Get ready for an amazing experience.
              </p>
              <div className="mt-8">
                <Link
                  href="/overview"
                  className="inline-flex items-center px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  <span>Learn More</span>
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}
        {appStatus !== 'developing' && (
          <WalletConnectMessageContainer>
            <div className="flex flex-col gap-4 w-full">
              <div className="flex justify-end">
                <RefreshButtonContainer />
              </div>
              <AssetTableContainer />
            </div>
          </WalletConnectMessageContainer>
        )}
      </main>
    </div>
  );
}
