import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AmountInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  currency?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
};

export function AmountInput({
  id,
  label,
  value,
  onChange,
  placeholder = '0.00',
  step = '0.01',
  min = 0,
  max,
  currency,
  disabled = false,
  error,
  helperText,
}: AmountInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`pr-20 ${error ? 'border-red-500' : ''}`}
        />
        {currency && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currency}
          </div>
        )}
      </div>
      {helperText && (
        <div className="text-xs text-muted-foreground">{helperText}</div>
      )}
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}

type ReadOnlyFieldProps = {
  id: string;
  label: string;
  value: string;
  className?: string;
};

export function ReadOnlyField({ id, label, value, className = 'bg-muted' }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} disabled className={className} />
    </div>
  );
}

type ConfirmationInfoProps = {
  items: Array<{ label: string; value: string | number; highlight?: boolean }>;
};

export function ConfirmationInfo({ items }: ConfirmationInfoProps) {
  return (
    <div className="bg-muted p-3 rounded-lg space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span>{item.label}:</span>
          <span className={item.highlight ? 'font-semibold' : ''}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
