import { Router } from 'express';
import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { createUser } from '../services/user.service.js';
import { hashPassword } from '../services/auth.service.js';
import { logAudit } from '../services/audit.service.js';

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth, requireAdmin);

const serializeUser = (user: User) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
});

const roleSchema = z.union([z.literal('ADMIN'), z.literal('USER')]);

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
    role: roleSchema.default('USER'),
});

const updateUserSchema = z.object({
    name: z.string().nullable().optional(),
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
    password: z.string().min(8),
});

adminUsersRouter.get('/', async (_req, res) => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
    });
    res.json({ users: users.map(serializeUser) });
});

adminUsersRouter.post('/', async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }

    const existing = await prisma.user.findUnique({
        where: { email: parsed.data.email },
    });
    if (existing) {
        return res
            .status(409)
            .json({ error: 'A user with that email already exists' });
    }

    const user = await createUser(parsed.data);
    logAudit({
        actorUserId: req.user!.id,
        action: 'admin.user_create',
        targetType: 'user',
        targetId: user.id,
        metadata: { email: user.email, role: user.role },
    });
    res.status(201).json({ user: serializeUser(user) });
});

adminUsersRouter.patch('/:id', async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }

    const isSelf = req.user!.id === (req.params.id as string);

    if (parsed.data.role === 'USER' && isSelf) {
        const adminCount = await prisma.user.count({
            where: { role: 'ADMIN', isActive: true },
        });
        if (adminCount <= 1) {
            return res
                .status(400)
                .json({ error: 'Cannot demote the only admin' });
        }
    }

    if (parsed.data.isActive === false && isSelf) {
        return res
            .status(400)
            .json({ error: 'Cannot deactivate your own account' });
    }

    const user = await prisma.user.update({
        where: { id: req.params.id as string },
        data: parsed.data,
    });
    logAudit({
        actorUserId: req.user!.id,
        action: 'admin.user_update',
        targetType: 'user',
        targetId: user.id,
        metadata: parsed.data,
    });
    res.json({ user: serializeUser(user) });
});

adminUsersRouter.post('/:id/reset-password', async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.update({
        where: { id: req.params.id as string },
        data: { passwordHash },
    });
    // A password reset invalidates any existing sessions for that account.
    await prisma.session.deleteMany({
        where: { userId: req.params.id as string },
    });

    logAudit({
        actorUserId: req.user!.id,
        action: 'admin.user_reset_password',
        targetType: 'user',
        targetId: req.params.id as string,
    });

    res.json({ success: true });
});

adminUsersRouter.delete('/:id', async (req, res) => {
    if (req.user!.id === (req.params.id as string)) {
        return res
            .status(400)
            .json({ error: 'Cannot deactivate your own account' });
    }

    const user = await prisma.user.update({
        where: { id: req.params.id as string },
        data: { isActive: false },
    });
    await prisma.session.deleteMany({
        where: { userId: req.params.id as string },
    });

    logAudit({
        actorUserId: req.user!.id,
        action: 'admin.user_deactivate',
        targetType: 'user',
        targetId: user.id,
    });

    res.json({ user: serializeUser(user) });
});
