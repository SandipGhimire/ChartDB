import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/table/table';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/dropdown-menu/dropdown-menu';
import { useToast } from '@/components/toast/use-toast';
import { listUsers, deactivateUser, type AdminUser } from '@/lib/admin-api';
import { CreateUserDialog } from '@/dialogs/admin/create-user-dialog';
import { EditUserDialog } from '@/dialogs/admin/edit-user-dialog';
import { ResetPasswordDialog } from '@/dialogs/admin/reset-password-dialog';

export const UsersTab: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [resetUser, setResetUser] = useState<AdminUser | null>(null);
    const [search, setSearch] = useState('');

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) =>
                u.email.toLowerCase().includes(q) ||
                (u.name ?? '').toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q)
        );
    }, [users, search]);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const { users } = await listUsers();
            setUsers(users);
        } catch {
            toast({ title: 'Failed to load users', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleDeactivate = useCallback(
        async (target: AdminUser) => {
            try {
                await deactivateUser(target.id);
                toast({ title: `${target.email} deactivated` });
                refresh();
            } catch (error) {
                toast({
                    title:
                        error instanceof Error
                            ? error.message
                            : 'Failed to deactivate user',
                    variant: 'destructive',
                });
            }
        },
        [refresh, toast]
    );

    return (
        <div className="flex flex-1 flex-col overflow-auto p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by email, name, or role…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    Create user
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.name ?? '—'}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        u.role === 'ADMIN'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {u.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        u.isActive ? 'secondary' : 'destructive'
                                    }
                                >
                                    {u.isActive ? 'Active' : 'Deactivated'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => setEditUser(u)}
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setResetUser(u)}
                                        >
                                            Reset password
                                        </DropdownMenuItem>
                                        {u.isActive &&
                                        u.id !== currentUser?.id ? (
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    handleDeactivate(u)
                                                }
                                            >
                                                Deactivate
                                            </DropdownMenuItem>
                                        ) : null}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!loading && filteredUsers.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground"
                            >
                                {users.length === 0
                                    ? 'No users yet.'
                                    : 'No users match your search.'}
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
            <CreateUserDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={refresh}
            />
            <EditUserDialog
                user={editUser}
                onOpenChange={(open) => !open && setEditUser(null)}
                onUpdated={refresh}
            />
            <ResetPasswordDialog
                user={resetUser}
                onOpenChange={(open) => !open && setResetUser(null)}
            />
        </div>
    );
};
