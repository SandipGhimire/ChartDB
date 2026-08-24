import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/dropdown-menu/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { Avatar, AvatarFallback } from '@/components/avatar/avatar';
import { Badge } from '@/components/badge/badge';
import { useAuth } from '@/hooks/use-auth';
import { ShieldCheck, LogOut, UserCog } from 'lucide-react';

const getInitials = (name: string | null, email: string): string => {
    if (name) {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
    }
    return email.slice(0, 2).toUpperCase();
};

export interface UserMenuProps {}

export const UserMenu: React.FC<UserMenuProps> = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = useMemo(
        () => (user ? getInitials(user.name, user.email) : ''),
        [user]
    );

    const handleLogout = useCallback(async () => {
        await logout();
        navigate('/login');
    }, [logout, navigate]);

    if (!user) {
        return null;
    }

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <button className="cursor-pointer">
                            <Avatar className="size-6 md:size-8">
                                <AvatarFallback className="bg-primary text-[10px] text-primary-foreground md:text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Account</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="truncate text-sm font-medium">
                        {user.name || user.email}
                    </span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                    </span>
                </DropdownMenuLabel>
                <div className="px-2 pb-1.5">
                    <Badge
                        variant={
                            user.role === 'ADMIN' ? 'default' : 'secondary'
                        }
                    >
                        {user.role === 'ADMIN' ? 'Admin' : 'User'}
                    </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserCog className="mr-2 size-4" />
                    Edit profile
                </DropdownMenuItem>
                {user.role === 'ADMIN' ? (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <ShieldCheck className="mr-2 size-4" />
                        Admin panel
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
