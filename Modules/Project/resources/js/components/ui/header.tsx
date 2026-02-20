import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface HeaderProps {
    title: string;
    description?: string | null;
    backHref: string;
    backLabel: string;
    badges?: ReactNode;
    actions?: ReactNode;
}

export const Header = ({
    title,
    description,
    backHref,
    backLabel,
    badges,
    actions,
}: HeaderProps) => {
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <Link
                href={backHref}
                className="mb-4 inline-flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
                <ArrowLeft className="mr-1 h-5 w-5" />
                {backLabel}
            </Link>

            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 max-w-2xl text-gray-600">
                            {description}
                        </p>
                    )}
                </div>
                <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                    {badges}
                    {actions}
                </div>
            </div>
        </div>
    );
};
