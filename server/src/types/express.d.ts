import type { DiagramMember, User } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: User;
            diagramMembership?: DiagramMember;
        }
    }
}

export {};
