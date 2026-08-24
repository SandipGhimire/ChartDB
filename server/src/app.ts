import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from './prisma.js';
import { attachUser } from './middleware/attach-user.js';
import { authRouter } from './routes/auth.routes.js';
import { adminUsersRouter } from './routes/admin-users.routes.js';
import { adminDiagramsRouter } from './routes/admin-diagrams.routes.js';
import { adminAuditLogRouter } from './routes/admin-audit-log.routes.js';
import { diagramsRouter } from './routes/diagrams.routes.js';
import { configRouter } from './routes/config.routes.js';
import {
    tablesFlatUpdateRouter,
    relationshipsFlatUpdateRouter,
    dependenciesFlatUpdateRouter,
    areasFlatUpdateRouter,
    customTypesFlatUpdateRouter,
    notesFlatUpdateRouter,
} from './routes/diagram-resources.routes.js';
import { errorHandler } from './middleware/error-handler.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/diagrams', adminDiagramsRouter);
app.use('/api/admin/audit-log', adminAuditLogRouter);
app.use('/api/diagrams', diagramsRouter);
app.use('/api/config', configRouter);
app.use('/api/tables', tablesFlatUpdateRouter);
app.use('/api/relationships', relationshipsFlatUpdateRouter);
app.use('/api/dependencies', dependenciesFlatUpdateRouter);
app.use('/api/areas', areasFlatUpdateRouter);
app.use('/api/custom-types', customTypesFlatUpdateRouter);
app.use('/api/notes', notesFlatUpdateRouter);

app.get('/api/health/db', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(503).json({ status: 'error' });
    }
});

app.use(errorHandler);
