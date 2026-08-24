import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireAdmin } from '../middleware/require-admin.js';

export const adminAuditLogRouter = Router();

adminAuditLogRouter.use(requireAuth, requireAdmin);

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

adminAuditLogRouter.get('/', async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, Number(req.query.pageSize) || DEFAULT_PAGE_SIZE)
    );

    const where = {
        ...(req.query.actorUserId
            ? { actorUserId: req.query.actorUserId as string }
            : {}),
        ...(req.query.action ? { action: req.query.action as string } : {}),
    };

    const [entries, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: { actor: { select: { email: true } } },
        }),
        prisma.auditLog.count({ where }),
    ]);

    res.json({
        entries,
        page,
        pageSize,
        total,
    });
});
