import type { IncomingMessage, Server as HttpServer } from 'http';
import type { Socket } from 'net';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { parse as parseCookie } from 'cookie';
import { env } from '../env.js';
import { getUserBySessionId } from '../services/auth.service.js';
import { hasSufficientDiagramRole } from '../middleware/require-diagram-role.js';
import {
    joinRoom,
    leaveRoom,
    presenceFor,
    broadcast,
    type WsClient,
} from './rooms.js';

interface JoinMessage {
    type: 'join';
    diagramId: string;
}

interface PatchMessage {
    type: 'patch';
    resource: string;
    action: 'add' | 'update' | 'remove';
    id: string;
    payload: unknown;
}

type InboundMessage = JoinMessage | PatchMessage;

const parseMessage = (raw: unknown): InboundMessage | null => {
    if (typeof raw !== 'string') return null;
    try {
        const data = JSON.parse(raw);
        if (data?.type === 'join' && typeof data.diagramId === 'string') {
            return { type: 'join', diagramId: data.diagramId };
        }
        if (
            data?.type === 'patch' &&
            typeof data.resource === 'string' &&
            typeof data.action === 'string' &&
            typeof data.id === 'string'
        ) {
            return {
                type: 'patch',
                resource: data.resource,
                action: data.action,
                id: data.id,
                payload: data.payload,
            };
        }
        return null;
    } catch {
        return null;
    }
};

export const attachWebSocketServer = (httpServer: HttpServer) => {
    const wss = new WebSocketServer({ noServer: true });

    httpServer.on(
        'upgrade',
        async (req: IncomingMessage, socket: Socket, head: Buffer) => {
            if (!req.url || !req.url.startsWith('/ws')) {
                return;
            }

            const cookies = parseCookie(req.headers.cookie ?? '');
            const sessionId = cookies[env.SESSION_COOKIE_NAME];
            const user = sessionId ? await getUserBySessionId(sessionId) : null;

            if (!user) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, user);
            });
        }
    );

    wss.on(
        'connection',
        (
            ws: WebSocket,
            user: { id: string; email: string; name: string | null }
        ) => {
            const client: WsClient = {
                ws,
                userId: user.id,
                email: user.email,
                name: user.name,
            };

            ws.on('message', async (raw) => {
                const message = parseMessage(raw.toString());
                if (!message) return;

                if (message.type === 'join') {
                    if (client.diagramId) {
                        leaveRoom(client);
                    }
                    const access = await hasSufficientDiagramRole(
                        client.userId,
                        message.diagramId,
                        'VIEWER'
                    );
                    if (access !== 'ok') {
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                message: 'Not authorized for this diagram',
                            })
                        );
                        return;
                    }
                    joinRoom(message.diagramId, client);
                    broadcast(message.diagramId, {
                        type: 'presence',
                        users: presenceFor(message.diagramId),
                    });
                    return;
                }

                if (message.type === 'patch') {
                    if (!client.diagramId) return;
                    const access = await hasSufficientDiagramRole(
                        client.userId,
                        client.diagramId,
                        'EDITOR'
                    );
                    if (access !== 'ok') return;
                    broadcast(
                        client.diagramId,
                        {
                            type: 'patch',
                            resource: message.resource,
                            action: message.action,
                            id: message.id,
                            payload: message.payload,
                            actorUserId: client.userId,
                        },
                        client
                    );
                }
            });

            ws.on('close', () => {
                if (!client.diagramId) return;
                const diagramId = client.diagramId;
                leaveRoom(client);
                broadcast(diagramId, {
                    type: 'presence',
                    users: presenceFor(diagramId),
                });
            });
        }
    );

    return wss;
};
