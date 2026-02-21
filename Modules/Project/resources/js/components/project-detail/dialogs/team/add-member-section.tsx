import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { User } from '@/types';
import { Plus } from 'lucide-react';

interface AddMemberSectionProps {
    availableUsers: User[];
    selectedUserId: string;
    onUserSelect: (userId: string) => void;
    onAddMember: () => void;
}

export const AddMemberSection = ({
    availableUsers,
    selectedUserId,
    onUserSelect,
    onAddMember,
}: AddMemberSectionProps) => {
    return (
        <div className="rounded-lg border bg-gray-50 p-4">
            <Label className="mb-2 block text-sm font-semibold">
                Pridať člena
            </Label>
            <div className="flex gap-2">
                <Select value={selectedUserId} onValueChange={onUserSelect}>
                    <SelectTrigger className="flex-1 bg-white">
                        <SelectValue placeholder="Vyberte používateľa..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableUsers.length === 0 ? (
                            <div className="p-3 text-center text-sm text-gray-500">
                                Všetci používatelia sú už priradení
                            </div>
                        ) : (
                            availableUsers.map((user) => (
                                <SelectItem
                                    key={user.id}
                                    value={user.id.toString()}
                                >
                                    <div>
                                        <div className="font-medium">
                                            {user.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {user.email}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    onClick={onAddMember}
                    disabled={!selectedUserId || availableUsers.length === 0}
                >
                    <Plus size={18} className="mr-2" />
                    Pridať
                </Button>
            </div>
        </div>
    );
};
