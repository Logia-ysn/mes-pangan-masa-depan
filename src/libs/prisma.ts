import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isProduction = process.env.NODE_ENV === 'production';

// Enrich DATABASE_URL with connection pool params if not already present
const databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    process.env.DATABASE_URL = `${databaseUrl}${separator}connection_limit=10&pool_timeout=10&connect_timeout=10`;
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: isProduction ? ['error', 'warn'] : ['error', 'warn'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

