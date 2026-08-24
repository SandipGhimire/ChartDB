import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

export const touchDiagram = async (
    tx: Prisma.TransactionClient,
    diagramId: string
) => {
    await tx.diagram.update({
        where: { id: diagramId },
        data: { updatedAt: new Date() },
    });
};

export const createDiagramWithOwner = (params: {
    id: string;
    name: string;
    databaseType: string;
    databaseEdition?: string | null;
    ownerId: string;
}) =>
    prisma.$transaction(async (tx) => {
        const diagram = await tx.diagram.create({
            data: {
                id: params.id,
                name: params.name,
                databaseType: params.databaseType,
                databaseEdition: params.databaseEdition,
            },
        });
        await tx.diagramMember.create({
            data: {
                diagramId: diagram.id,
                userId: params.ownerId,
                role: 'OWNER',
            },
        });
        return diagram;
    });

// BigInt createdAt fields can't be JSON-serialized by res.json() directly.
export const serializeBigIntCreatedAt = <T extends { createdAt: bigint }>(
    record: T
): Omit<T, 'createdAt'> & { createdAt: number } => ({
    ...record,
    createdAt: Number(record.createdAt),
});
