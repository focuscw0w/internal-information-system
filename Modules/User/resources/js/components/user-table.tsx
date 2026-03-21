import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface ManagedUser {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface UserTableProps {
    users: ManagedUser[];
}

export const UserTable = ({ users }: UserTableProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Existujúci používatelia</CardTitle>
                <CardDescription>
                    Jednoduchý prehľad kont vytvorených v systéme.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b text-muted-foreground">
                            <tr>
                                <th className="py-3 pr-4 font-medium">Meno</th>
                                <th className="py-3 pr-4 font-medium">
                                    Email
                                </th>
                                <th className="py-3 font-medium">Vytvorený</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="py-3 pr-4 font-medium">
                                        {user.name}
                                    </td>
                                    <td className="py-3 pr-4 text-muted-foreground">
                                        {user.email}
                                    </td>
                                    <td className="py-3 text-muted-foreground">
                                        {new Date(
                                            user.created_at,
                                        ).toLocaleDateString('sk-SK')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};