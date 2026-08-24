import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    SESSION_COOKIE_NAME: z.string().default('chartdb_sid'),
    SESSION_TTL_HOURS: z.coerce
        .number()
        .int()
        .positive()
        .default(24 * 7),
    BOOTSTRAP_ADMIN_EMAIL: z.preprocess(
        (v) => (v === '' ? undefined : v),
        z.string().email().optional()
    ),
    BOOTSTRAP_ADMIN_PASSWORD: z.preprocess(
        (v) => (v === '' ? undefined : v),
        z.string().min(8).optional()
    ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(
        'Invalid environment configuration:',
        parsed.error.flatten().fieldErrors
    );
    throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
