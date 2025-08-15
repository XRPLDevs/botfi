import { Settings } from 'lucide-react';
import { WalletConnectButton } from '@/app/(app)/_components/wallet-connect-button';
import { IconButton } from '@/components/icon-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { WalletTypes } from '@/types/wallet';

export default function Topbar() {
  return (
    <header className="fixed flex justify-between px-8 w-screen h-16 items-center border-b border-gray-300">
      <h1 className="font-bold text-2xl">BotFi</h1>
      <div className="flex gap-3">
        <WalletConnectButton walletType={WalletTypes.XAMAN} className="cursor-pointer" />
        <ThemeToggle />
        <IconButton>
          <Settings />
        </IconButton>
      </div>
    </header>
  );
}
