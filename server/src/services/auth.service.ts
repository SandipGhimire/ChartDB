import { hash, verify } from '@node-rs/argon2';
import type { User } from '@prisma/client';
import { prisma } from '../prisma.js';
import { env } from '../env.js';

export const hashPassword = (password: string): Promise<string> =>
    hash(password);

export const verifyPassword = (
    passwordHash: string,
    password: string
): Promise<boolean> => verify(passwordHash, password);

export const createSession = async (
    userId: string,
    meta: { userAgent?: string; ipAddress?: string }
) => {
    const expiresAt = new Date(
        Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000
    );
    return prisma.session.create({
        data: {
            userId,
            expiresAt,
            userAgent: meta.userAgent,
            ipAddress: meta.ipAddress,
        },
    });
};

export const destroySession = (sessionId: string) =>
    prisma.session.delete({ where: { id: sessionId } }).catch(() => {
        // already gone, nothing to do
    });

export const getUserBySessionId = async (
    sessionId: string
): Promise<User | null> => {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
        return null;
    }

    if (!session.user.isActive) {
        return null;
    }

    return session.user;
};
