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


export default prisma

