import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type BaseDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
};

export function BaseDialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}: BaseDialogProps) {
  const maxWidthClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
  }[maxWidth];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={maxWidthClass} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">{children}</div>

        {footer && <DialogFooter className="gap-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

type BaseDialogFooterProps = {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
  isConfirmDisabled?: boolean;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

export function BaseDialogFooter({
  onCancel,
  onConfirm,
  cancelText = 'キャンセル',
  confirmText = '実行',
  isLoading = false,
  isConfirmDisabled = false,
  confirmVariant = 'default',
}: BaseDialogFooterProps) {
  return (
    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={onCancel} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        onClick={onConfirm}
        disabled={isLoading || isConfirmDisabled}
        variant={confirmVariant}
      >
        {isLoading ? '処理中...' : confirmText}
      </Button>
    </DialogFooter>
  );
}
