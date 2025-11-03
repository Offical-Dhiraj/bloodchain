import { Prisma, PrismaClient } from '@/generated/prisma';

// ✅ Extend PrismaClient to include $use
declare module '@/generated/prisma' {
    interface PrismaClient {
        $use(
            middleware: Prisma.Middleware
        ): void;
    }
}
