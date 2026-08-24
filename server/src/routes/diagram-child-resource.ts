import { Router } from 'express';
import type { z } from 'zod';
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma.js';
import {
    requireDiagramRole,
    hasSufficientDiagramRole,
} from '../middleware/require-diagram-role.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
    touchDiagram,
    serializeBigIntCreatedAt,
} from '../services/diagram.service.js';

// Tables/relationships/dependencies/areas/customTypes/notes all share the
// same shape: a flat list of rows scoped by diagramId, with identical
// list/get/create/update/delete semantics. This factory implements that
// shape once instead of six near-identical route files.
//
// The Prisma delegate is accessed dynamically by model name, so it's typed
// loosely here (args: any) — the real safety net is the zod schema at the
// request boundary, not the Prisma delegate's generated types.
/* eslint-disable @typescript-eslint/no-explicit-any */
type ModelDelegate = {
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any | null>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<{ count: number }>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type ChildModelName =
    | 'dbTable'
    | 'dbRelationship'
    | 'dbDependency'
    | 'area'
    | 'dbCustomType'
    | 'note';

const getDelegate = (
    client: PrismaClient | Prisma.TransactionClient,
    modelName: ChildModelName
): ModelDelegate =>
    (client as unknown as Record<ChildModelName, ModelDelegate>)[modelName];

export function createChildResourceRouter<TCreate, TUpdate>({
    modelName,
    createSchema,
    updateSchema,
    hasBigIntCreatedAt = false,
    supportsUpsert = false,
}: {
    modelName: ChildModelName;
    createSchema: z.ZodType<TCreate>;
    updateSchema: z.ZodType<TUpdate>;
    hasBigIntCreatedAt?: boolean;
    supportsUpsert?: boolean;
}) {
    const router = Router({ mergeParams: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialize = (record: any) =>
        hasBigIntCreatedAt ? serializeBigIntCreatedAt(record) : record;

    router.get('/', requireDiagramRole('VIEWER'), async (req, res) => {
        const items = await getDelegate(prisma, modelName).findMany({
            where: { diagramId: req.params.diagramId as string },
        });
        res.json({ items: items.map(serialize) });
    });

    router.get('/:id', requireDiagramRole('VIEWER'), async (req, res) => {
        const item = await getDelegate(prisma, modelName).findFirst({
            where: {
                id: req.params.id as string,
                diagramId: req.params.diagramId as string,
            },
        });
        if (!item) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json({ item: serialize(item) });
    });

    router.post('/', requireDiagramRole('EDITOR'), async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid payload',
                details: parsed.error.flatten(),
            });
        }

        const created = await prisma.$transaction(async (tx) => {
            const record = await getDelegate(tx, modelName).create({
                data: {
                    ...parsed.data,
                    diagramId: req.params.diagramId as string,
                },
            });
            await touchDiagram(tx, req.params.diagramId as string);
            return record;
        });

        res.status(201).json({ item: serialize(created) });
    });

    if (supportsUpsert) {
        router.put('/:id', requireDiagramRole('EDITOR'), async (req, res) => {
            const parsed = createSchema.safeParse({
                ...req.body,
                id: req.params.id as string,
            });
            if (!parsed.success) {
                return res.status(400).json({
                    error: 'Invalid payload',
                    details: parsed.error.flatten(),
                });
            }

            const upserted = await prisma.$transaction(async (tx) => {
                const record = await getDelegate(tx, modelName).upsert({
                    where: { id: req.params.id as string },
                    create: {
                        ...parsed.data,
                        diagramId: req.params.diagramId as string,
                    },
                    update: parsed.data,
                });
                await touchDiagram(tx, req.params.diagramId as string);
                return record;
            });

            res.json({ item: serialize(upserted) });
        });
    }

    router.patch('/:id', requireDiagramRole('EDITOR'), async (req, res) => {
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid payload',
                details: parsed.error.flatten(),
            });
        }

        const updated = await prisma.$transaction(async (tx) => {
            const record = await getDelegate(tx, modelName).update({
                where: { id: req.params.id as string },
                data: parsed.data,
            });
            await touchDiagram(tx, req.params.diagramId as string);
            return record;
        });

        res.json({ item: serialize(updated) });
    });

    router.delete('/:id', requireDiagramRole('EDITOR'), async (req, res) => {
        await prisma.$transaction(async (tx) => {
            await getDelegate(tx, modelName).delete({
                where: { id: req.params.id as string },
            });
            await touchDiagram(tx, req.params.diagramId as string);
        });
        res.status(204).end();
    });

    router.delete('/', requireDiagramRole('EDITOR'), async (req, res) => {
        await prisma.$transaction(async (tx) => {
            await getDelegate(tx, modelName).deleteMany({
                where: { diagramId: req.params.diagramId as string },
            });
            await touchDiagram(tx, req.params.diagramId as string);
        });
        res.status(204).end();
    });

    return router;
}

// The StorageContext interface's update*() methods (updateTable,
// updateRelationship, ...) only receive { id, attributes } — no diagramId,
// since Dexie updates by primary key alone. A diagramId-scoped URL can't
// serve that call, so this is a flat /api/<resource>/:id route instead: it
// resolves the record's diagramId from the row itself, then checks the
// caller's role against that resolved diagram before applying the update.
export function createFlatUpdateRouter<TUpdate>({
    modelName,
    updateSchema,
    hasBigIntCreatedAt = false,
}: {
    modelName: ChildModelName;
    updateSchema: z.ZodType<TUpdate>;
    hasBigIntCreatedAt?: boolean;
}) {
    const router = Router();

    const serialize = (record: {
        createdAt: bigint;
        [key: string]: unknown;
    }) => (hasBigIntCreatedAt ? serializeBigIntCreatedAt(record) : record);

    router.patch('/:id', requireAuth, async (req, res) => {
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid payload',
                details: parsed.error.flatten(),
            });
        }

        const existing = await getDelegate(prisma, modelName).findFirst({
            where: { id: req.params.id as string },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Not found' });
        }

        const roleCheck = await hasSufficientDiagramRole(
            req.user!.id,
            existing.diagramId,
            'EDITOR'
        );
        if (roleCheck === 'not-a-member') {
            return res.status(404).json({ error: 'Not found' });
        }
        if (roleCheck === 'insufficient-role') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const updated = await prisma.$transaction(async (tx) => {
            const record = await getDelegate(tx, modelName).update({
                where: { id: req.params.id as string },
                data: parsed.data,
            });
            await touchDiagram(tx, existing.diagramId);
            return record;
        });

        res.json({ item: serialize(updated) });
    });

    return router;
}
