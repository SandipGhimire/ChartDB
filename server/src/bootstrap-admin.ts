import { prisma } from './prisma.js';
import { env } from './env.js';
import { createUser } from './services/user.service.js';

// Runs once at boot. Self-hosted deployments have no public signup, so the
// only way in on a fresh database is an admin account created from env vars.
export const bootstrapAdmin = async () => {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        return;
    }

    if (!env.BOOTSTRAP_ADMIN_EMAIL || !env.BOOTSTRAP_ADMIN_PASSWORD) {
        console.warn(
            'No users exist yet. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create the first admin account on next boot.'
        );
        return;
    }

    await createUser({
        email: env.BOOTSTRAP_ADMIN_EMAIL,
        password: env.BOOTSTRAP_ADMIN_PASSWORD,
        role: 'ADMIN',
    });

    console.log(`Bootstrapped admin account: ${env.BOOTSTRAP_ADMIN_EMAIL}`);
};
