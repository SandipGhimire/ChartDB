import { prisma } from '../src/prisma.js';
import { createUser } from '../src/services/user.service.js';

const DEV_ADMIN_EMAIL = 'admin@chartdb.local';
const DEV_ADMIN_PASSWORD = 'change-me-please';

const main = async () => {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        console.log('Users already exist, skipping seed.');
        return;
    }

    await createUser({
        email: DEV_ADMIN_EMAIL,
        password: DEV_ADMIN_PASSWORD,
        role: 'ADMIN',
    });

    console.log(
        `Seeded dev admin account: ${DEV_ADMIN_EMAIL} / ${DEV_ADMIN_PASSWORD} (change this before deploying anywhere real)`
    );
};

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
