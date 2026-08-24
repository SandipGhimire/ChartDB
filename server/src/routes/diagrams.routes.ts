import { Router } from 'express';
import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireDiagramRole } from '../middleware/require-diagram-role.js';
import {
    createDiagramWithOwner,
    serializeBigIntCreatedAt,
} from '../services/diagram.service.js';
import { logAudit } from '../services/audit.service.js';
import { diagramCreateSchema, diagramUpdateSchema } from '../lib/schemas.js';
import { membersRouter } from './diagram-members.routes.js';
import { filterRouter } from './diagram-filter.routes.js';
import {
    tablesRouter,
    relationshipsRouter,
    dependenciesRouter,
    areasRouter,
    customTypesRouter,
    notesRouter,
} from './diagram-resources.routes.js';

export const diagramsRouter = Router();

diagramsRouter.use(requireAuth);

const parseInclude = (req: Request): Prisma.DiagramInclude => {
    const raw = (req.query.include as string | undefined) ?? '';
    const requested = new Set(
        raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    );
    const include: Prisma.DiagramInclude = {};
    if (requested.has('tables')) include.tables = true;
    if (requested.has('relationships')) include.relationships = true;
    if (requested.has('dependencies')) include.dependencies = true;
    if (requested.has('areas')) include.areas = true;
    if (requested.has('customTypes')) include.customTypes = true;
    if (requested.has('notes')) include.notes = true;
    return include;
};

// Nested arrays carry BigInt createdAt fields, which res.json() can't
// serialize directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeDiagram = (diagram: any) => ({
    ...diagram,
    tables: diagram.tables?.map(serializeBigIntCreatedAt),
    relationships: diagram.relationships?.map(serializeBigIntCreatedAt),
    dependencies: diagram.dependencies?.map(serializeBigIntCreatedAt),
});

diagramsRouter.get('/', async (req, res) => {
    const include = parseInclude(req);
    const memberships = await prisma.diagramMember.findMany({
        where: { userId: req.user!.id },
        include: { diagram: { include } },
    });

    res.json({
        diagrams: memberships.map((m) => ({
            ...serializeDiagram(m.diagram),
            currentUserRole: m.role,
        })),
    });
});

diagramsRouter.post('/', async (req, res) => {
    const parsed = diagramCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }

    const diagram = await createDiagramWithOwner({
        ...parsed.data,
        ownerId: req.user!.id,
    });

    logAudit({
        actorUserId: req.user!.id,
        action: 'diagram.create',
        targetType: 'diagram',
        targetId: diagram.id,
        diagramId: diagram.id,
        metadata: { name: diagram.name },
    });

    res.status(201).json({
        diagram: { ...diagram, currentUserRole: 'OWNER' },
    });
});

diagramsRouter.get('/:id', requireDiagramRole('VIEWER'), async (req, res) => {
    const include = parseInclude(req);
    const diagram = await prisma.diagram.findUnique({
        where: { id: req.params.id as string },
        include,
    });
    if (!diagram) {
        return res.status(404).json({ error: 'Diagram not found' });
    }
    res.json({
        diagram: {
            ...serializeDiagram(diagram),
            currentUserRole: req.diagramMembership!.role,
        },
    });
});

diagramsRouter.patch('/:id', requireDiagramRole('EDITOR'), async (req, res) => {
    const parsed = diagramUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten(),
        });
    }
    const diagram = await prisma.diagram.update({
        where: { id: req.params.id as string },
        data: parsed.data,
    });
    res.json({ diagram });
});

diagramsRouter.delete('/:id', requireDiagramRole('OWNER'), async (req, res) => {
    const diagram = await prisma.diagram.delete({
        where: { id: req.params.id as string },
    });
    logAudit({
        actorUserId: req.user!.id,
        action: 'diagram.delete',
        targetType: 'diagram',
        targetId: diagram.id,
        diagramId: diagram.id,
        metadata: { name: diagram.name },
    });
    res.status(204).end();
});

diagramsRouter.use('/:id/members', membersRouter);
diagramsRouter.use('/:diagramId/tables', tablesRouter);
diagramsRouter.use('/:diagramId/relationships', relationshipsRouter);
diagramsRouter.use('/:diagramId/dependencies', dependenciesRouter);
diagramsRouter.use('/:diagramId/areas', areasRouter);
diagramsRouter.use('/:diagramId/custom-types', customTypesRouter);
diagramsRouter.use('/:diagramId/notes', notesRouter);
diagramsRouter.use('/:diagramId/filter', filterRouter);
