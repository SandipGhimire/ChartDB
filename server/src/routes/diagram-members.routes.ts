import { Router } from 'express';
import { z } from 'zod';
import { requireDiagramRole } from '../middleware/require-diagram-role.js';
import {
    listMembers,
    addMember,
    updateMemberRole,
    removeMember,
} from '../services/diagram-member.service.js';

export const membersRouter = Router({ mergeParams: true });

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

membersRouter.get('/', requireDiagramRole('OWNER'), async (req, res) => {
    const members = await listMembers(req.params.id as string);
    res.json({ members });
});

membersRouter.post('/', requireDiagramRole('OWNER'), async (req, res) => {
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

membersRouter.patch(
    '/:userId',
    requireDiagramRole('OWNER'),
    async (req, res) => {
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
    }
);

membersRouter.delete(
    '/:userId',
    requireDiagramRole('OWNER'),
    async (req, res) => {
        const result = await removeMember(
            req.params.id as string,
            req.params.userId as string,
            req.user!.id
        );
        if (!result.ok) {
            return res.status(result.status).json({ error: result.error });
        }

        res.status(204).end();
    }
);
