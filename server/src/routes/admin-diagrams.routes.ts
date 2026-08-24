import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { logAudit } from '../services/audit.service.js';
import { diagramUpdateSchema } from '../lib/schemas.js';
import {
    listMembers,
    addMember,
    updateMemberRole,
    removeMember,
} from '../services/diagram-member.service.js';

export const adminDiagramsRouter = Router();

adminDiagramsRouter.use(requireAuth, requireAdmin);

const roleSchema = z.union([
    z.literal('OWNER'),
    z.literal('EDITOR'),
    z.literal('VIEWER'),
]);

const addMemberSchema = z.object({
    email: z.string().email(),
    role: roleSchema,
});

const updateMemberSchema = z.object({
    role: roleSchema,
});

adminDiagramsRouter.get('/', async (_req, res) => {
    const diagrams = await prisma.diagram.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: { select: { members: true, tables: true } },
            members: {
                where: { role: 'OWNER' },
                include: { user: { select: { email: true } } },
            },
        },
    });

    res.json({
        diagrams: diagrams.map(({ members, _count, ...diagram }) => ({
            ...diagram,
            memberCount: _count.members,
            tableCount: _count.tables,
            ownerEmail: members[0]?.user.email ?? null,
        })),
    });
});

adminDiagramsRouter.get('/:id/members', async (req, res) => {
    const members = await listMembers(req.params.id as string);
    res.json({ members });
});

adminDiagramsRouter.post('/:id/members', async (req, res) => {
    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }

    const result = await addMember(
        req.params.id as string,
        parsed.data.email,
        parsed.data.role,
        req.user!.id
    );
    if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
    }

    res.status(201).json({ member: result.data });
});

adminDiagramsRouter.patch('/:id/members/:userId', async (req, res) => {
    const parsed = updateMemberSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    const result = await updateMemberRole(
        req.params.id as string,
        req.params.userId as string,
        parsed.data.role,
        req.user!.id
    );
    if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
    }

    res.json({ member: result.data });
});

adminDiagramsRouter.delete('/:id/members/:userId', async (req, res) => {
    const result = await removeMember(
        req.params.id as string,
        req.params.userId as string,
        req.user!.id
    );
    if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
    }

    res.status(204).end();
});

adminDiagramsRouter.patch('/:id', async (req, res) => {
    const parsed = diagramUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }

    const diagram = await prisma.diagram.update({
        where: { id: req.params.id as string },
        data: parsed.data,
    });

    logAudit({
        actorUserId: req.user!.id,
        action: 'admin.diagram_update',
        targetType: 'diagram',
        targetId: diagram.id,
        diagramId: diagram.id,
        metadata: parsed.data,
    });

    res.json({ diagram });
});

adminDiagramsRouter.delete('/:id', async (req, res) => {
    const diagram = await prisma.diagram.delete({
        where: { id: req.params.id as string },
    });

    logAudit({
        actorUserId: req.user!.id,
        action: 'diagram.delete',
        targetType: 'diagram',
        targetId: diagram.id,
        diagramId: diagram.id,
        metadata: { name: diagram.name },
    });

    res.status(204).end();
});
