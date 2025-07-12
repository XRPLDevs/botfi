'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <Button variant="ghost" aria-label="Toggle theme" className="h-9 w-9 p-0" />;

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      aria-label="Toggle theme"
      className="h-9 w-9 p-0"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title="Toggle theme"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
