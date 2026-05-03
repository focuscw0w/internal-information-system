import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface HeaderProps {
    title: string;
    description?: string | null;
    backHref: string;
    backLabel: string;
    children?: ReactNode;
}

const HeaderRoot = ({
    title,
    description,
    backHref,
    backLabel,
    children,
}: HeaderProps) => {
    return (
        <div className="page-head relative">
            <div>
                <Link href={backHref} className="page-head__back mb-4">
                    <ArrowLeft />
                    {backLabel}
                </Link>

                <h1 className="page-head__title">{title}</h1>
                {description && (
                    <p className="page-head__subtitle">{description}</p>
                )}
            </div>

            {children && <div className="page-head__actions">{children}</div>}
        </div>
    );
};

const HeaderBadges = ({ children }: { children: ReactNode }) => {
    return <div className="flex items-center gap-2">{children}</div>;
};

const HeaderActions = ({ children }: { children: ReactNode }) => {
    return <div className="flex items-center gap-2">{children}</div>;
};

export const Header = Object.assign(HeaderRoot, {
    Badges: HeaderBadges,
    Actions: HeaderActions,
});
