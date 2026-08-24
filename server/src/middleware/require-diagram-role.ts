import type { NextFunction, Request, Response } from 'express';
import type { DiagramRole } from '@prisma/client';
import { prisma } from '../prisma.js';

export const ROLE_RANK: Record<DiagramRole, number> = {
    VIEWER: 1,
    EDITOR: 2,
    OWNER: 3,
};

export const hasSufficientDiagramRole = async (
    userId: string,
    diagramId: string,
    minRole: DiagramRole
): Promise<'ok' | 'not-a-member' | 'insufficient-role'> => {
    const membership = await prisma.diagramMember.findUnique({
        where: { diagramId_userId: { diagramId, userId } },
    });
    if (!membership) return 'not-a-member';
    if (ROLE_RANK[membership.role] < ROLE_RANK[minRole])
        return 'insufficient-role';
    return 'ok';
};

// Diagram-scoped routes are mounted under either /api/diagrams/:id or
// /api/diagrams/:diagramId/... — accept whichever param is present.
const getDiagramId = (req: Request): string | undefined =>
    (req.params.diagramId as string) ?? (req.params.id as string);

export const requireDiagramRole = (minRole: DiagramRole) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const diagramId = getDiagramId(req);
        if (!diagramId) {
            return res.status(400).json({ error: 'Missing diagram id' });
        }

        let membership = req.diagramMembership;
        if (!membership || membership.diagramId !== diagramId) {
            membership =
                (await prisma.diagramMember.findUnique({
                    where: {
                        diagramId_userId: {
                            diagramId,
                            userId: req.user.id,
                        },
                    },
                })) ?? undefined;
            req.diagramMembership = membership;
        }

        if (!membership) {
            // 404, not 403 — don't leak whether the diagram exists to
            // callers who aren't a member of it.
            return res.status(404).json({ error: 'Diagram not found' });
        }

        if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};
