import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';

interface Permission {
    value: string;
    label: string;
}

interface UserPermissionsCardProps {
    permissions: Permission[];
}

export const UserPermissionsCard = ({
    permissions,
}: UserPermissionsCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Systémové oprávnenia
                </CardTitle>
                <CardDescription>
                    Oprávnenia pridelené administrátorom.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {permissions.map((perm) => (
                            <Badge key={perm.value} variant="secondary">
                                {perm.label}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Žiadne systémové oprávnenia.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
