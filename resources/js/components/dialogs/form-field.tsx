import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FormFieldProps {
    label: string;
    id: string;
    type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
    rows?: number;
    min?: string | number;
    step?: string;
}

export function FormField({
    label,
    id,
    type = 'text',
    value,
    onChange,
    error,
    required = false,
    placeholder,
    options = [],
    rows = 3,
    min,
    step,
}: FormFieldProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>

            {type === 'textarea' ? (
                <Textarea
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    required={required}
                />
            ) : type === 'select' ? (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                    step={step}
                />
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
