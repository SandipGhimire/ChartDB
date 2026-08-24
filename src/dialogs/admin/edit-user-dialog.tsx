import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/dialog/dialog';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { Button } from '@/components/button/button';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/select/select';
import { useToast } from '@/components/toast/use-toast';
import { updateUser, type AdminUser } from '@/lib/admin-api';

export interface EditUserDialogProps {
    user: AdminUser | null;
    onOpenChange: (open: boolean) => void;
    onUpdated: () => void;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
    user,
    onOpenChange,
    onUpdated,
}) => {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name ?? '');
            setRole(user.role);
        }
    }, [user]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            await updateUser(user.id, { name: name || null, role });
            toast({ title: `${user.email} updated` });
            onOpenChange(false);
            onUpdated();
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to update user',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={!!user} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit {user?.email}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-user-name">Name</Label>
                            <Input
                                id="edit-user-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Role</Label>
                            <Select
                                value={role}
                                onValueChange={(value) =>
                                    setRole(value as 'ADMIN' | 'USER')
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
