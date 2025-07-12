'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster position="bottom-left" richColors closeButton duration={4000} expand={true} />
  );
}

export { toast };
