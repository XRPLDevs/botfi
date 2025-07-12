import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RefreshButtonViewProps = {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
};

export function RefreshButtonView({ onRefresh, isLoading }: RefreshButtonViewProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isLoading}
      className="h-9 w-9 p-0"
      title="Refresh data"
    >
      <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
    </Button>
  );
}
