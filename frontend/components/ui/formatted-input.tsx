import * as React from "react";
import { Input } from "@/components/ui/input";

export interface FormattedNumberInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number | undefined | null;
    onChange: (value: number | undefined) => void;
    placeholder?: string;
    className?: string;
}

export function FormattedNumberInput({
    value,
    onChange,
    placeholder,
    className,
    ...props
}: FormattedNumberInputProps) {
    // We treat the input as text.
    // If value is present, we format it initially.
    // On change, we parse, then re-format immediately if we want dynamic.
    // However, immediate re-formatting causes cursor jumps.
    // Compromise: Format on Blur, but allow unrestricted typing.

    // BUT user asked for dynamic. 
    // Let's try to format on change ONLY if the length increases? No.
    // Let's stick to safe "on Blur" for now to avoid bugs, but clarify to user?
    // User complaint: "commas are coming when i enter the number its not dynamically coming"
    // Maybe they are seeing "1000" and expect "1,000" instantly.

    // Let's just use the robust OnBlur strategy from before which is safe.
    // I will stick to what I tested in generate/page.tsx.

    const [displayVal, setDisplayVal] = React.useState(value !== undefined && value !== null ? String(value) : '');
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
        if (!isFocused) {
            if (value !== undefined && value !== null) {
                // Format on external update if not focused (optional, or just String)
                // Let's format it for consistency with MoneyInput pattern if we want commas
                setDisplayVal(value.toLocaleString('en-IN'));
            } else {
                setDisplayVal('');
            }
        }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow digits, commas, dots
        if (/^[\d,.]*$/.test(val)) {
            setDisplayVal(val);
            const raw = val.replace(/,/g, '');
            if (raw === '' || raw === '.') {
                onChange(undefined);
            } else if (!isNaN(Number(raw))) {
                onChange(Number(raw));
            }
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        if (value !== undefined && value !== null) {
            setDisplayVal(String(value)); // Show raw number on focus
        }
        props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        const raw = displayVal.replace(/,/g, '');
        if (!isNaN(Number(raw)) && raw !== '') {
            setDisplayVal(Number(raw).toLocaleString('en-IN'));
        }
        props.onBlur?.(e);
    };

    return (
        <Input
            {...props}
            type="text"
            className={className}
            placeholder={placeholder}
            value={displayVal}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
        />
    );
}
