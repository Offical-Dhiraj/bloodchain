import { PrismaClient, Prisma } from '@/generated/prisma' // <-- CORRECTED IMPORT
import { Logger } from '@/lib/utils/logger'

/**
 * PRISMA CLIENT
 * Singleton pattern for database connection
 */

const logger = new Logger('Prisma')

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
    })

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// Log database connection
prisma.$connect()
    .then(() => {
        logger.info('Database connected successfully')
    })
    .catch((error) => {
        logger.critical('Database connection failed', error)
        process.exit(1)
    })

// Middleware for logging queries in development
if (process.env.NODE_ENV === 'development') {
    // ---
    // **FIX:** Added types for `params` and `next`
    // ---
    prisma.$use(async (
        params,
        next
    ) => {
        const before = Date.now()
        const result = await next(params)
        const after = Date.now()

        // Check if model and action are available
        if (params.model && params.action) {
            logger.debug(`Query ${params.model}.${params.action}`, {
                duration: `${after - before}ms`,
                // Safely stringify args
                args: JSON.stringify(params.args),
            })
        } else {
            logger.debug(`Prisma Query`, {
                duration: `${after - before}ms`,
                params: params.action
            })
        }

        return result
    })
}

export default prisma

