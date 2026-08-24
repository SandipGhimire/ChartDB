import { app } from './app.js';
import { env } from './env.js';
import { prisma } from './prisma.js';
import { bootstrapAdmin } from './bootstrap-admin.js';
import { attachWebSocketServer } from './ws/index.js';

await bootstrapAdmin();

const server = app.listen(env.PORT, () => {
    console.log(
        `chartdb-server listening on port ${env.PORT} (${env.NODE_ENV})`
    );
});

attachWebSocketServer(server);

const shutdown = async () => {
    console.log('Shutting down...');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
