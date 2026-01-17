import * as React from 'react';
import { Input } from '@/components/ui/input';

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number | undefined | null;
    onChange: (value: number) => void;
    placeholder?: string;
}

export function MoneyInput({ className, value, onChange, placeholder = '0', ...props }: MoneyInputProps) {
    // Format helper
    const formatValue = (val: string | number | undefined | null): string => {
        if (val === undefined || val === null || val === '') return '';
        const strVal = String(val);
        const parts = strVal.split('.');
        const integerPart = parts[0].replace(/[^0-9]/g, ''); // strip non-digits
        // Format integer part with Indian locale
        const formattedInt = integerPart ? Number(integerPart).toLocaleString('en-IN') : '';

        if (parts.length > 1) {
            return `${formattedInt}.${parts[1]}`;
        }
        return formattedInt;
    };

    const [displayValue, setDisplayValue] = React.useState('');

    // Sync with external value
    // We only sync if the numeric value of display doesn't match the prop (to allow intermediate states like "1.")
    // Or if not focused?
    // User wants DYNAMIC formatting. So we WANT to sync.
    React.useEffect(() => {
        // If prop changes, we update display. 
        // We use the same formatting logic.
        const formatted = formatValue(value);

        // Only update if conceptually different to avoid some cursor jumps if possible?
        // Actually, if we want dynamic format matching "1,000", we must update.
        setDisplayValue(formatted);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        // Remove commas to get raw number
        const raw = input.replace(/,/g, '');

        // Check valid number pattern (allows digits and one dot)
        if (!/^\d*\.?\d*$/.test(raw)) return;

        // If simple delete leading to empty
        if (raw === '') {
            onChange(0);
            return;
        }

        const num = Number(raw);
        if (!isNaN(num)) {
            // Update parent logic
            onChange(num);

            // Note: Parent update -> useEffect -> setDisplayValue(formatted).
            // This loop ensures "1000" -> "1,000".
            // Cursor will likely jump to end.
        }
    };

    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
            <Input
                {...props}
                type="text"
                value={displayValue}
                onChange={handleChange}
                className={`pl-7 ${className}`} // Padding for symbol
            />
        </div>
    );
}
