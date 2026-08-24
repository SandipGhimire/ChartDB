import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireDiagramRole } from '../middleware/require-diagram-role.js';
import { touchDiagram } from '../services/diagram.service.js';
import { diagramFilterSchema } from '../lib/schemas.js';

export const filterRouter = Router({ mergeParams: true });

filterRouter.get('/', requireDiagramRole('VIEWER'), async (req, res) => {
    const filter = await prisma.diagramFilter.findUnique({
        where: { diagramId: req.params.diagramId as string },
    });
    res.json({ filter });
});

filterRouter.put('/', requireDiagramRole('EDITOR'), async (req, res) => {
    const parsed = diagramFilterSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }

    const filter = await prisma.$transaction(async (tx) => {
        const record = await tx.diagramFilter.upsert({
            where: { diagramId: req.params.diagramId as string },
            create: {
                diagramId: req.params.diagramId as string,
                schemaIds: parsed.data.schemaIds,
                tableIds: parsed.data.tableIds,
            },
            update: {
                schemaIds: parsed.data.schemaIds,
                tableIds: parsed.data.tableIds,
            },
        });
        await touchDiagram(tx, req.params.diagramId as string);
        return record;
    });

    res.json({ filter });
});

filterRouter.delete('/', requireDiagramRole('EDITOR'), async (req, res) => {
    await prisma.$transaction(async (tx) => {
        await tx.diagramFilter
            .delete({ where: { diagramId: req.params.diagramId as string } })
            .catch(() => {
                // no filter set, nothing to delete
            });
        await touchDiagram(tx, req.params.diagramId as string);
    });
    res.status(204).end();
});
