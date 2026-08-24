import type { NextFunction, Request, Response } from 'express';
import { env } from '../env.js';
import { getUserBySessionId } from '../services/auth.service.js';

export const attachUser = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const sessionId = req.cookies?.[env.SESSION_COOKIE_NAME] as
        | string
        | undefined;

    if (!sessionId) {
        return next();
    }

    const user = await getUserBySessionId(sessionId);
    if (user) {
        req.user = user;
    }

    next();
};
