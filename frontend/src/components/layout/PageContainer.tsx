'use client'

import dynamic from 'next/dynamic';

const Container = dynamic(() => import('@mui/material/Container'), { ssr: false });

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function PageContainer({ children, maxWidth = 'sm' }: PageContainerProps) {
  return (
    <Container maxWidth={maxWidth} sx={{ py: 4 }}>
      {children}
    </Container>
  );
}
