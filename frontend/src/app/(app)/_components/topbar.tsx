import { WalletConnectButton } from '@/app/(app)/_components/wallet-connect-button';
import { ThemeDropdown } from '@/components/theme-dropdown';
import { WalletTypes } from '@/types/wallet';

const appStatus = process.env.NEXT_PUBLIC_APP_STATUS

export default function Topbar() {
  return (
    <header className="fixed flex justify-between px-8 w-screen h-16 items-center border-b border-gray-300">
      <h1 className="font-bold text-2xl">BotFi</h1>
      <div className="flex gap-3">
        {appStatus === 'developing' && <WalletConnectButton walletType={WalletTypes.XAMAN} className="cursor-pointer" />}
        <ThemeDropdown />
      </div>
    </header>
  );
}
