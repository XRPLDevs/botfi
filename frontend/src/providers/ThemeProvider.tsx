'use client'

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

import { ReactNode } from 'react'

const theme = createTheme({
  typography: {
    fontFamily: notoSans.style.fontFamily,
  },
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}
