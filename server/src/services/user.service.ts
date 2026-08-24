import type { GlobalRole } from '@prisma/client';
import { prisma } from '../prisma.js';
import { hashPassword } from './auth.service.js';

export const createUser = async (params: {
    email: string;
    password: string;
    name?: string;
    role?: GlobalRole;
}) => {
    const passwordHash = await hashPassword(params.password);
    return prisma.user.create({
        data: {
            email: params.email,
            passwordHash,
            name: params.name,
            role: params.role ?? 'USER',
        },
    });
};
