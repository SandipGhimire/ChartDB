import type { DiagramRole } from '@prisma/client';
import { prisma } from '../prisma.js';
import { logAudit } from './audit.service.js';

const memberInclude = {
    user: { select: { id: true, email: true, name: true } },
} as const;

export type DiagramMemberServiceResult<T> =
    | { ok: true; data: T }
    | { ok: false; status: number; error: string };

export const listMembers = (diagramId: string) =>
    prisma.diagramMember.findMany({
        where: { diagramId },
        include: memberInclude,
    });

export const addMember = async (
    diagramId: string,
    email: string,
    role: DiagramRole,
    actorUserId: string
): Promise<
    DiagramMemberServiceResult<
        Awaited<ReturnType<typeof prisma.diagramMember.upsert>>
    >
> => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { ok: false, status: 404, error: 'No user with that email' };
    }

    const member = await prisma.diagramMember.upsert({
        where: { diagramId_userId: { diagramId, userId: user.id } },
        create: { diagramId, userId: user.id, role },
        update: { role },
        include: memberInclude,
    });

    logAudit({
        actorUserId,
        action: 'diagram.member_add',
        targetType: 'diagram_member',
        targetId: user.id,
        diagramId,
        metadata: { email, role },
    });

    return { ok: true, data: member };
};

const isLastOwner = async (diagramId: string, userId: string) => {
    const target = await prisma.diagramMember.findUnique({
        where: { diagramId_userId: { diagramId, userId } },
    });
    if (target?.role !== 'OWNER') {
        return false;
    }
    const ownerCount = await prisma.diagramMember.count({
        where: { diagramId, role: 'OWNER' },
    });
    return ownerCount <= 1;
};

export const updateMemberRole = async (
    diagramId: string,
    userId: string,
    role: DiagramRole,
    actorUserId: string
): Promise<
    DiagramMemberServiceResult<
        Awaited<ReturnType<typeof prisma.diagramMember.update>>
    >
> => {
    if (role !== 'OWNER' && (await isLastOwner(diagramId, userId))) {
        return {
            ok: false,
            status: 400,
            error: 'Cannot demote the last owner',
        };
    }

    const member = await prisma.diagramMember.update({
        where: { diagramId_userId: { diagramId, userId } },
        data: { role },
    });

    logAudit({
        actorUserId,
        action: 'diagram.member_role_change',
        targetType: 'diagram_member',
        targetId: userId,
        diagramId,
        metadata: { role },
    });

    return { ok: true, data: member };
};

export const removeMember = async (
    diagramId: string,
    userId: string,
    actorUserId: string
): Promise<DiagramMemberServiceResult<void>> => {
    if (await isLastOwner(diagramId, userId)) {
        return {
            ok: false,
            status: 400,
            error: 'Cannot remove the last owner',
        };
    }

    await prisma.diagramMember
        .delete({ where: { diagramId_userId: { diagramId, userId } } })
        .catch(() => {
            // already gone, nothing to do
        });

    logAudit({
        actorUserId,
        action: 'diagram.member_remove',
        targetType: 'diagram_member',
        targetId: userId,
        diagramId,
    });

    return { ok: true, data: undefined };
};
