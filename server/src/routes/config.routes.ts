import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/require-auth.js';

export const configRouter = Router();

configRouter.use(requireAuth);

const updateConfigSchema = z.object({
    defaultDiagramId: z.string().optional(),
});

configRouter.get('/', (req, res) => {
    res.json({
        config: { defaultDiagramId: req.user!.defaultDiagramId ?? '' },
    });
});

configRouter.patch('/', async (req, res) => {
    const parsed = updateConfigSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: parsed.data,
    });

    res.json({ config: { defaultDiagramId: user.defaultDiagramId ?? '' } });
});
