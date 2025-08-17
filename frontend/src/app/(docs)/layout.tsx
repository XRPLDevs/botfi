import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import Topbar from '@/app/(docs)/_components/topbar';
import { ThemeProvider } from '@/app/(app)/_providers/theme-provider';
import '@/app/(docs)/globals.css';

const notoSans = Noto_Sans({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'BotFi',
  description: 'BotFi is a platform for creating and managing your own bots on the XRPL.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSans.variable} antialiased`}>
        <ThemeProvider>
          <Topbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
