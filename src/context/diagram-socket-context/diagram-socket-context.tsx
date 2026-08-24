import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export interface DiagramPresenceUser {
    userId: string;
    email: string;
    name: string | null;
    selectedTableIds: string[];
}

export type DiagramPatchAction = 'add' | 'update' | 'remove';

export interface DiagramPatchMessage {
    resource: string;
    action: DiagramPatchAction;
    id: string;
    payload: unknown;
    actorUserId: string;
}

export type DiagramPatchHandler = (message: DiagramPatchMessage) => void;

export interface DiagramSocketContext {
    presence: DiagramPresenceUser[];
    sendPatch: (
        resource: string,
        action: DiagramPatchAction,
        id: string,
        payload?: unknown
    ) => void;
    subscribePatch: (handler: DiagramPatchHandler) => () => void;
    sendSelect: (tableIds: string[]) => void;
}

export const diagramSocketContext = createContext<DiagramSocketContext>({
    presence: [],
    sendPatch: emptyFn,
    subscribePatch: () => emptyFn,
    sendSelect: emptyFn,
});
