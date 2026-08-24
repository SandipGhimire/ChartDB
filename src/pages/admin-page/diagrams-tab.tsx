import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';
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
import {
    listAllDiagrams,
    deleteDiagramAsAdmin,
    type AdminDiagram,
} from '@/lib/admin-diagrams-api';
import { ManageDiagramMembersDialog } from '@/dialogs/admin/manage-diagram-members-dialog';
import { RenameDiagramDialog } from '@/dialogs/admin/rename-diagram-dialog';

export const DiagramsTab: React.FC = () => {
    const { toast } = useToast();
    const [diagrams, setDiagrams] = useState<AdminDiagram[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [manageMembersId, setManageMembersId] = useState<
        string | undefined
    >();
    const [renameDiagram, setRenameDiagram] = useState<AdminDiagram | null>(
        null
    );

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const { diagrams } = await listAllDiagrams();
            setDiagrams(diagrams);
        } catch {
            toast({
                title: 'Failed to load diagrams',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const filteredDiagrams = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return diagrams;
        return diagrams.filter(
            (d) =>
                d.name.toLowerCase().includes(q) ||
                (d.ownerEmail ?? '').toLowerCase().includes(q) ||
                d.databaseType.toLowerCase().includes(q)
        );
    }, [diagrams, search]);

    const handleDelete = useCallback(
        async (diagram: AdminDiagram) => {
            if (
                !window.confirm(
                    `Delete "${diagram.name}"? This cannot be undone.`
                )
            ) {
                return;
            }
            try {
                await deleteDiagramAsAdmin(diagram.id);
                toast({ title: `${diagram.name} deleted` });
                refresh();
            } catch (error) {
                toast({
                    title:
                        error instanceof Error
                            ? error.message
                            : 'Failed to delete diagram',
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
                        placeholder="Search by name, owner, or database…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Database</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Tables</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredDiagrams.map((d) => (
                        <TableRow key={d.id}>
                            <TableCell>{d.name}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">
                                    {d.databaseType}
                                </Badge>
                            </TableCell>
                            <TableCell>{d.ownerEmail ?? '—'}</TableCell>
                            <TableCell>{d.memberCount}</TableCell>
                            <TableCell>{d.tableCount}</TableCell>
                            <TableCell>
                                {new Date(d.updatedAt).toLocaleString()}
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
                                            onClick={() => setRenameDiagram(d)}
                                        >
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setManageMembersId(d.id)
                                            }
                                        >
                                            Manage members
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => handleDelete(d)}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!loading && filteredDiagrams.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground"
                            >
                                {diagrams.length === 0
                                    ? 'No diagrams yet.'
                                    : 'No diagrams match your search.'}
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
            <ManageDiagramMembersDialog
                diagramId={manageMembersId}
                onOpenChange={(open) => {
                    if (!open) {
                        setManageMembersId(undefined);
                        refresh();
                    }
                }}
            />
            <RenameDiagramDialog
                diagram={renameDiagram}
                onOpenChange={(open) => !open && setRenameDiagram(null)}
                onRenamed={refresh}
            />
        </div>
    );
};
