import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users as UsersIcon,
    Database,
    ScrollText,
    ArrowLeft,
} from 'lucide-react';
import { LocalConfigProvider } from '@/context/local-config-context/local-config-provider';
import { ThemeProvider } from '@/context/theme-context/theme-provider';
import { Toaster } from '@/components/toast/toaster';
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset,
    SidebarTrigger,
} from '@/components/sidebar/sidebar';
import { Separator } from '@/components/separator/separator';
import { UserMenu } from '@/pages/editor-page/top-navbar/user-menu/user-menu';
import { ThemeNav } from '@/pages/editor-page/top-navbar/theme-nav/theme-nav';
import { useAuth } from '@/hooks/use-auth';
import { OverviewTab } from './overview-tab';
import { UsersTab } from './users-tab';
import { DiagramsTab } from './diagrams-tab';
import { AuditLogTab } from './audit-log-tab';

type AdminSection = 'overview' | 'users' | 'diagrams' | 'audit-log';

const NAV_ITEMS: {
    section: AdminSection;
    label: string;
    icon: React.FC<{ className?: string }>;
}[] = [
    { section: 'overview', label: 'Overview', icon: LayoutDashboard },
    { section: 'users', label: 'Users', icon: UsersIcon },
    { section: 'diagrams', label: 'Diagrams', icon: Database },
    { section: 'audit-log', label: 'Audit Log', icon: ScrollText },
];

const AdminPageComponent: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();

    const section = useMemo<AdminSection | null>(() => {
        const match = location.pathname.match(/^\/admin\/?([^/]*)/);
        const raw = match?.[1] ?? '';
        if (!raw) return null;
        const found = NAV_ITEMS.find((item) => item.section === raw);
        return found?.section ?? null;
    }, [location.pathname]);

    if (section === null) {
        return <Navigate to="/admin/overview" replace />;
    }

    const activeItem = NAV_ITEMS.find((item) => item.section === section)!;

    return (
        <>
            <Helmet>
                <title>Admin · {activeItem.label}</title>
            </Helmet>
            <SidebarProvider className="h-screen w-screen">
                <Sidebar collapsible="icon" variant="sidebar">
                    <SidebarHeader>
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4 shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden">
                                Back to app
                            </span>
                        </Link>
                        <Separator />
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {NAV_ITEMS.map((item) => (
                                        <SidebarMenuItem key={item.section}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={
                                                    item.section === section
                                                }
                                                tooltip={item.label}
                                            >
                                                <Link
                                                    to={`/admin/${item.section}`}
                                                >
                                                    <item.icon className="size-4" />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter>
                        <Separator className="mb-1" />
                        <div className="flex flex-col gap-0.5 truncate px-2 py-1 group-data-[collapsible=icon]:hidden">
                            {user?.name ? (
                                <span className="truncate text-xs font-medium">
                                    {user.name}
                                </span>
                            ) : null}
                            <span
                                className={
                                    user?.name
                                        ? 'truncate text-xs text-muted-foreground'
                                        : 'truncate text-xs font-medium'
                                }
                            >
                                {user?.email}
                            </span>
                        </div>
                    </SidebarFooter>
                </Sidebar>
                <SidebarInset className="overflow-hidden">
                    <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger />
                            <Separator
                                orientation="vertical"
                                className="mr-1 h-4"
                            />
                            <span className="font-semibold">
                                {activeItem.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeNav />
                            <UserMenu />
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col overflow-hidden">
                        {section === 'overview' ? <OverviewTab /> : null}
                        {section === 'users' ? <UsersTab /> : null}
                        {section === 'diagrams' ? <DiagramsTab /> : null}
                        {section === 'audit-log' ? <AuditLogTab /> : null}
                    </div>
                </SidebarInset>
            </SidebarProvider>
            <Toaster />
        </>
    );
};

export const AdminPage: React.FC = () => (
    <LocalConfigProvider>
        <ThemeProvider>
            <AdminPageComponent />
        </ThemeProvider>
    </LocalConfigProvider>
);
