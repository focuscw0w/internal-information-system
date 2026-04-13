import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, User as UserIcon } from 'lucide-react';

interface UserInfoCardProps {
    user: {
        name: string;
        email: string;
        is_admin: boolean;
        created_at: string;
    };
}

export const UserInfoCard = ({ user }: UserInfoCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Osobné údaje
                    {user.is_admin && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Zmenu údajov vykonáva administrátor.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <dl className="space-y-3 text-sm">
                    <div>
                        <dt className="text-muted-foreground">Meno</dt>
                        <dd className="mt-0.5 font-medium">{user.name}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {user.email}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">
                            Účet vytvorený
                        </dt>
                        <dd className="mt-0.5 font-medium">
                            {new Date(user.created_at).toLocaleDateString(
                                'sk-SK',
                                {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                },
                            )}
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
};
