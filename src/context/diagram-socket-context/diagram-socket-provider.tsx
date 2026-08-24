import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { STORAGE_MODE } from '@/lib/env';
import type {
    DiagramPatchAction,
    DiagramPatchHandler,
    DiagramPresenceUser,
} from './diagram-socket-context';
import { diagramSocketContext } from './diagram-socket-context';

type InboundMessage =
    | { type: 'presence'; users: DiagramPresenceUser[] }
    | {
          type: 'patch';
          resource: string;
          action: DiagramPatchAction;
          id: string;
          payload: unknown;
          actorUserId: string;
      }
    | { type: 'error'; message: string };

export const DiagramSocketProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { diagramId } = useParams<{ diagramId: string }>();
    const [presence, setPresence] = useState<DiagramPresenceUser[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const handlersRef = useRef(new Set<DiagramPatchHandler>());

    useEffect(() => {
        if (STORAGE_MODE !== 'api' || !diagramId) {
            setPresence([]);
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
        socketRef.current = ws;

        ws.addEventListener('open', () => {
            ws.send(JSON.stringify({ type: 'join', diagramId }));
        });

        ws.addEventListener('message', (event) => {
            let message: InboundMessage;
            try {
                message = JSON.parse(event.data);
            } catch {
                return;
            }

            if (message.type === 'presence') {
                setPresence(message.users);
            } else if (message.type === 'patch') {
                for (const handler of handlersRef.current) {
                    handler(message);
                }
            }
        });

        ws.addEventListener('close', () => {
            setPresence([]);
        });

        return () => {
            socketRef.current = null;
            setPresence([]);
            ws.close();
        };
    }, [diagramId]);

    const sendPatch = useCallback(
        (
            resource: string,
            action: DiagramPatchAction,
            id: string,
            payload?: unknown
        ) => {
            const ws = socketRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            ws.send(
                JSON.stringify({ type: 'patch', resource, action, id, payload })
            );
        },
        []
    );

    const subscribePatch = useCallback((handler: DiagramPatchHandler) => {
        handlersRef.current.add(handler);
        return () => {
            handlersRef.current.delete(handler);
        };
    }, []);

    const value = useMemo(
        () => ({ presence, sendPatch, subscribePatch }),
        [presence, sendPatch, subscribePatch]
    );

    return (
        <diagramSocketContext.Provider value={value}>
            {children}
        </diagramSocketContext.Provider>
    );
};
