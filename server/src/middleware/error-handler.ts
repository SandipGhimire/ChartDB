import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Not found' });
        }
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Already exists' });
        }
    }

    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
};
