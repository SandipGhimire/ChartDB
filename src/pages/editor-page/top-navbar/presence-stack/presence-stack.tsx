import React, { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/avatar/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useDiagramSocket } from '@/hooks/use-diagram-socket';
import { getInitials } from '@/lib/utils';

const MAX_VISIBLE = 4;

export interface PresenceStackProps {}

export const PresenceStack: React.FC<PresenceStackProps> = () => {
    const { user } = useAuth();
    const { presence } = useDiagramSocket();

    const others = useMemo(
        () => presence.filter((u) => u.userId !== user?.id),
        [presence, user?.id]
    );

    if (others.length === 0) {
        return null;
    }

    const visible = others.slice(0, MAX_VISIBLE);
    const overflow = others.length - visible.length;

    return (
        <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg border bg-background/85 px-2 py-1 shadow-lg backdrop-blur-sm">
            <div className="flex items-center -space-x-2">
                {visible.map((presenceUser) => (
                    <Tooltip key={presenceUser.userId}>
                        <TooltipTrigger asChild>
                            <Avatar className="size-6 border-2 border-background md:size-8">
                                <AvatarFallback className="text-xs">
                                    {getInitials(
                                        presenceUser.name,
                                        presenceUser.email
                                    )}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            {presenceUser.name ?? presenceUser.email}
                        </TooltipContent>
                    </Tooltip>
                ))}
                {overflow > 0 ? (
                    <Avatar className="size-6 border-2 border-background md:size-8">
                        <AvatarFallback className="text-xs">
                            +{overflow}
                        </AvatarFallback>
                    </Avatar>
                ) : null}
            </div>
        </div>
    );
};
