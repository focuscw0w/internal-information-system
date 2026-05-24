import { Check, ChevronDown, Search, X } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

export type MultiSelectOption = {
    id: number;
    name: string;
};

type Props = {
    placeholder: string;
    options: MultiSelectOption[];
    value: number[];
    onChange: (value: number[]) => void;
    icon?: ReactNode;
    searchPlaceholder?: string;
    emptyText?: string;
};

export function MultiSelect({
    placeholder,
    options,
    value,
    onChange,
    icon,
    searchPlaceholder = 'Hľadať…',
    emptyText = 'Žiadne výsledky',
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const filtered = options.filter((option) =>
        option.name.toLowerCase().includes(query.toLowerCase()),
    );

    const toggle = (id: number) =>
        onChange(
            value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
        );

    const selectedNames = options
        .filter((option) => value.includes(option.id))
        .map((option) => option.name);

    return (
        <div ref={ref} className="multi-select__wrap">
            <button
                type="button"
                className="multi-select"
                onClick={() => setOpen((o) => !o)}
            >
                {icon}
                {value.length === 0 ? (
                    <span className="multi-select__placeholder">
                        {placeholder}
                    </span>
                ) : (
                    <span className="multi-select__selected">
                        {value.length === 1
                            ? selectedNames[0]
                            : `${value.length} vybrané`}
                    </span>
                )}
                {value.length > 0 && (
                    <span
                        role="button"
                        tabIndex={-1}
                        onClick={(event) => {
                            event.stopPropagation();
                            onChange([]);
                        }}
                        className="multi-select__clear"
                    >
                        <X className="h-3 w-3" />
                    </span>
                )}
                <ChevronDown className="multi-select__caret" />
            </button>
            {open && (
                <div className="multi-select__menu">
                    <div className="multi-select__search">
                        <Search className="h-3.5 w-3.5" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={searchPlaceholder}
                            autoFocus
                        />
                    </div>
                    <div className="multi-select__list">
                        {filtered.length === 0 ? (
                            <div className="multi-select__empty">
                                {emptyText}
                            </div>
                        ) : (
                            filtered.map((option) => {
                                const checked = value.includes(option.id);
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className="multi-select__item"
                                        onClick={() => toggle(option.id)}
                                    >
                                        <span
                                            className={`multi-select__check ${checked ? 'is-on' : ''}`}
                                        >
                                            {checked && (
                                                <Check className="h-2.5 w-2.5" />
                                            )}
                                        </span>
                                        {option.name}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {value.length > 0 && (
                        <div className="multi-select__foot">
                            <span className="multi-select__count">
                                {value.length} vybrané
                            </span>
                            <button
                                type="button"
                                className="multi-select__link"
                                onClick={() => onChange([])}
                            >
                                Vyčistiť
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
