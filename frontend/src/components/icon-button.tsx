import { Button } from '@/components/ui/button';

export function IconButton({ children, ...props }: React.ComponentProps<'button'>) {
  return (
    <Button variant="ghost" {...props}>
      {children}
    </Button>
  );
}
