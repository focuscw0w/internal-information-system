import { ReactNode } from 'react';

export interface Column<T> {
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    onRowClick?: (item: T) => void;
    emptyIcon?: ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: ReactNode;
}

export function DataTable<T>({
                                 columns,
                                 data,
                                 keyExtractor,
                                 onRowClick,
                                 emptyIcon,
                                 emptyTitle = 'Žiadne dáta.',
                                 emptyDescription,
                                 emptyAction,
                             }: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                {emptyIcon && <div className="mb-3">{emptyIcon}</div>}
                <p className="text-sm text-gray-500">{emptyTitle}</p>
                {emptyDescription && (
                    <p className="mt-1 text-xs text-gray-400">
                        {emptyDescription}
                    </p>
                )}
                {emptyAction && <div className="mt-4">{emptyAction}</div>}
            </div>
        );
    }

    return (
        <table className="w-full">
            <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                {columns.map((col) => (
                    <th
                        key={col.key}
                        className={`pb-3 font-medium ${col.width ?? ''} ${
                            col.align === 'center'
                                ? 'text-center'
                                : col.align === 'right'
                                    ? 'text-right'
                                    : 'text-left'
                        }`}
                    >
                        {col.label}
                    </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {data.map((item) => (
                <tr
                    key={keyExtractor(item)}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    className={`border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${
                        onRowClick ? 'cursor-pointer' : ''
                    }`}
                >
                    {columns.map((col) => (
                        <td
                            key={col.key}
                            className={`py-3 ${
                                col.align === 'center'
                                    ? 'text-center'
                                    : col.align === 'right'
                                        ? 'text-right'
                                        : ''
                            }`}
                        >
                            {col.render(item)}
                        </td>
                    ))}
                </tr>
            ))}
            </tbody>
        </table>
    );
}
