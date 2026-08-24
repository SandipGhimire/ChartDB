import type { WebSocket } from 'ws';

export interface WsClient {
    ws: WebSocket;
    userId: string;
    email: string;
    name: string | null;
    diagramId?: string;
}

// In-memory, single-process. Fine for one self-hosted instance; would need
// a shared pub/sub (e.g. Redis) to work correctly if ever scaled to
// multiple server processes.
const rooms = new Map<string, Set<WsClient>>();

export const joinRoom = (diagramId: string, client: WsClient) => {
    let room = rooms.get(diagramId);
    if (!room) {
        room = new Set();
        rooms.set(diagramId, room);
    }
    room.add(client);
    client.diagramId = diagramId;
};

export const leaveRoom = (client: WsClient) => {
    if (!client.diagramId) return;
    const room = rooms.get(client.diagramId);
    if (!room) return;
    room.delete(client);
    if (room.size === 0) {
        rooms.delete(client.diagramId);
    }
};

export const presenceFor = (diagramId: string) => {
    const room = rooms.get(diagramId);
    if (!room) return [];
    const seen = new Set<string>();
    const users: { userId: string; email: string; name: string | null }[] = [];
    for (const client of room) {
        if (seen.has(client.userId)) continue;
        seen.add(client.userId);
        users.push({
            userId: client.userId,
            email: client.email,
            name: client.name,
        });
    }
    return users;
};

export const broadcast = (
    diagramId: string,
    message: unknown,
    exclude?: WsClient
) => {
    const room = rooms.get(diagramId);
    if (!room) return;
    const payload = JSON.stringify(message);
    for (const client of room) {
        if (client === exclude) continue;
        if (client.ws.readyState === client.ws.OPEN) {
            client.ws.send(payload);
        }
    }
};
