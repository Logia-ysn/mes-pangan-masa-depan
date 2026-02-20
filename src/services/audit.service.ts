import { Prisma } from '@prisma/client';
import { prisma } from '../libs/prisma';

export interface AuditLogOptions {
    userId: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
    tableName: string;
    recordId: number;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
}

class AuditService {
    /**
     * Create a new audit log entry
     */
    async log(options: AuditLogOptions, tx?: Prisma.TransactionClient): Promise<void> {
        const db = tx || prisma;

        try {
            await db.auditLog.create({
                data: {
                    userId: options.userId,
                    action: options.action,
                    tableName: options.tableName,
                    recordId: options.recordId,
                    oldValue: options.oldValue ? (typeof options.oldValue === 'string' ? options.oldValue : JSON.stringify(options.oldValue)) : Prisma.JsonNull,
                    newValue: options.newValue ? (typeof options.newValue === 'string' ? options.newValue : JSON.stringify(options.newValue)) : Prisma.JsonNull,
                    ipAddress: options.ipAddress || null,
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // We don't throw here to avoid failing the main transaction if logging fails, 
            // unless it's critical. In this app, we'll just log to console.
        }
    }

    /**
     * Get audit logs with basic filtering
     */
    async getLogs(filters: {
        userId?: number;
        tableName?: string;
        action?: string;
        limit?: number;
        offset?: number;
    }) {
        return await prisma.auditLog.findMany({
            where: {
                userId: filters.userId,
                tableName: filters.tableName,
                action: filters.action
            },
            take: filters.limit || 50,
            skip: filters.offset || 0,
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: {
                        fullname: true,
                        role: true
                    }
                }
            }
        });
    }
}

export const auditService = new AuditService();
