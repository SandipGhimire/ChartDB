import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { env, isProduction } from '../env.js';
import {
    createSession,
    destroySession,
    hashPassword,
    verifyPassword,
} from '../services/auth.service.js';
import { requireAuth } from '../middleware/require-auth.js';
import { logAudit } from '../services/audit.service.js';
import type { User } from '@prisma/client';

export const authRouter = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const updateMeSchema = z.object({
    name: z.string().min(1).nullable(),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
});

const serializeUser = (user: User) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
});

const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.COOKIE_SECURE ?? isProduction,
    path: '/',
};

// Precomputed hash of a random, never-used password. Verified against on
// login when the email isn't found, so a nonexistent-account response takes
// the same time as a wrong-password response and doesn't leak which is true.
const DUMMY_HASH =
    '$argon2id$v=19$m=19456,t=2,p=1$Q29uc3RhbnRUaW1lU2FsdA$4bqEdyoIedTGkkOOsRz8QMoTJEMDpNwSc6PXsCk1CVA';

authRouter.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid email or password format' });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    const valid = await verifyPassword(
        user?.passwordHash ?? DUMMY_HASH,
        password
    );

    if (!user || !user.isActive || !valid) {
        logAudit({
            actorUserId: null,
            action: 'auth.login_failure',
            targetType: 'user',
            metadata: { email },
        });
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const session = await createSession(user.id, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
    });

    res.cookie(env.SESSION_COOKIE_NAME, session.id, {
        ...cookieOptions,
        expires: session.expiresAt,
    });

    logAudit({
        actorUserId: user.id,
        action: 'auth.login_success',
        targetType: 'user',
        targetId: user.id,
    });

    res.json({ user: serializeUser(user) });
});

authRouter.post('/logout', async (req, res) => {
    const sessionId = req.cookies?.[env.SESSION_COOKIE_NAME] as
        | string
        | undefined;
    if (sessionId) {
        await destroySession(sessionId);
    }
    if (req.user) {
        logAudit({
            actorUserId: req.user.id,
            action: 'auth.logout',
            targetType: 'user',
            targetId: req.user.id,
        });
    }
    res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
    res.json({ success: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
    res.json({ user: serializeUser(req.user!) });
});

authRouter.patch('/me', requireAuth, async (req, res) => {
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }

    const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { name: parsed.data.name },
    });

    logAudit({
        actorUserId: user.id,
        action: 'auth.profile_update',
        targetType: 'user',
        targetId: user.id,
    });

    res.json({ user: serializeUser(user) });
});

authRouter.post('/me/password', requireAuth, async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }

    const valid = await verifyPassword(
        req.user!.passwordHash,
        parsed.data.currentPassword
    );
    if (!valid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
        where: { id: req.user!.id },
        data: { passwordHash },
    });

    // Invalidate every other session for this account — the one making
    // this request just proved the current password, so it stays valid.
    const currentSessionId = req.cookies?.[env.SESSION_COOKIE_NAME] as
        | string
        | undefined;
    await prisma.session.deleteMany({
        where: {
            userId: req.user!.id,
            ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
    });

    logAudit({
        actorUserId: req.user!.id,
        action: 'auth.password_change',
        targetType: 'user',
        targetId: req.user!.id,
    });

    res.json({ success: true });
});
