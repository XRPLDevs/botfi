'use client';

import { ThemeDropdown } from '@/components/theme-dropdown';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Topbar() {
  const router = useRouter();

  return (
    <header className="fixed flex justify-between px-8 w-screen h-16 items-center border-b border-gray-300">
      <h1 className="font-bold text-2xl">BotFi</h1>
      <Button variant="ghost" onClick={() => router.push('/overview')}>
        Overview
      </Button>
      <div className="flex gap-3">
        <ThemeDropdown />
      </div>
    </header>
  );
}
