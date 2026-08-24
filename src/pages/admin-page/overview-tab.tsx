import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users as UsersIcon, Database, ShieldCheck, Clock } from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/card/card';
import { listUsers } from '@/lib/admin-api';
import { listAllDiagrams } from '@/lib/admin-diagrams-api';
import { listAuditLog, type AuditLogEntry } from '@/lib/admin-audit-log-api';

interface Stats {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    totalDiagrams: number;
    totalTables: number;
}

export const OverviewTab: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [{ users }, { diagrams }, { entries }] =
                    await Promise.all([
                        listUsers(),
                        listAllDiagrams(),
                        listAuditLog({ page: 1, pageSize: 8 }),
                    ]);
                if (cancelled) return;
                setStats({
                    totalUsers: users.length,
                    activeUsers: users.filter((u) => u.isActive).length,
                    adminUsers: users.filter((u) => u.role === 'ADMIN').length,
                    totalDiagrams: diagrams.length,
                    totalTables: diagrams.reduce(
                        (sum, d) => sum + d.tableCount,
                        0
                    ),
                });
                setRecentActivity(entries);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const cards = [
        {
            label: 'Users',
            value: stats?.totalUsers,
            sub: stats
                ? `${stats.activeUsers} active · ${stats.adminUsers} admin`
                : undefined,
            icon: UsersIcon,
            to: '/admin/users',
        },
        {
            label: 'Diagrams',
            value: stats?.totalDiagrams,
            sub: stats ? `${stats.totalTables} tables total` : undefined,
            icon: Database,
            to: '/admin/diagrams',
        },
        {
            label: 'Admins',
            value: stats?.adminUsers,
            sub: 'have full admin access',
            icon: ShieldCheck,
            to: '/admin/users',
        },
    ];

    return (
        <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {cards.map((card) => (
                    <Link key={card.label} to={card.to}>
                        <Card className="transition-colors hover:bg-accent/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.label}
                                </CardTitle>
                                <card.icon className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '—' : (card.value ?? 0)}
                                </div>
                                {card.sub ? (
                                    <p className="text-xs text-muted-foreground">
                                        {card.sub}
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="size-4" />
                        Recent activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!loading && recentActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No activity yet.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {recentActivity.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span>
                                        <span className="font-medium">
                                            {entry.actor?.email ?? 'System'}
                                        </span>{' '}
                                        <span className="text-muted-foreground">
                                            {entry.action}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {new Date(
                                            entry.createdAt
                                        ).toLocaleString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link
                        to="/admin/audit-log"
                        className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                        View full audit log →
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
};
