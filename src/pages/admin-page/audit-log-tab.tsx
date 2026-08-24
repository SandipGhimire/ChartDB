import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/table/table';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { useToast } from '@/components/toast/use-toast';
import { listAuditLog, type AuditLogEntry } from '@/lib/admin-audit-log-api';

const PAGE_SIZE = 50;

export const AuditLogTab: React.FC = () => {
    const { toast } = useToast();
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const filteredEntries = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return entries;
        return entries.filter(
            (entry) =>
                (entry.actor?.email ?? 'system').toLowerCase().includes(q) ||
                entry.action.toLowerCase().includes(q) ||
                entry.targetType.toLowerCase().includes(q) ||
                (entry.targetId ?? '').toLowerCase().includes(q)
        );
    }, [entries, search]);

    const refresh = useCallback(
        async (targetPage: number) => {
            setLoading(true);
            try {
                const result = await listAuditLog({
                    page: targetPage,
                    pageSize: PAGE_SIZE,
                });
                setEntries(result.entries);
                setTotal(result.total);
                setPage(result.page);
            } catch {
                toast({
                    title: 'Failed to load audit log',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        },
        [toast]
    );

    useEffect(() => {
        refresh(1);
    }, [refresh]);

    const hasNextPage = page * PAGE_SIZE < total;

    return (
        <div className="flex flex-1 flex-col overflow-auto p-6">
            <div className="mb-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search this page by actor, action, or target…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                            <TableCell>
                                {new Date(entry.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {entry.actor?.email ?? 'System'}
                            </TableCell>
                            <TableCell>{entry.action}</TableCell>
                            <TableCell>
                                {entry.targetId
                                    ? `${entry.targetType}:${entry.targetId}`
                                    : entry.targetType}
                            </TableCell>
                        </TableRow>
                    ))}
                    {!loading && filteredEntries.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="text-center text-muted-foreground"
                            >
                                {entries.length === 0
                                    ? 'No activity yet.'
                                    : 'No entries on this page match your search.'}
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => refresh(page - 1)}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
                    onClick={() => refresh(page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};
