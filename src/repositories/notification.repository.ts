import { BaseRepository } from './base.repository';
import { Notification, Notification_type_enum } from '@prisma/client';
import { prisma } from '../libs/prisma';

export class NotificationRepository extends BaseRepository<Notification> {
    protected modelName = 'Notification';

    async findByUser(id_user: number, limit = 50, offset = 0) {
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: { id_user },
                take: limit,
                skip: offset,
                orderBy: { created_at: 'desc' },
            }),
            prisma.notification.count({ where: { id_user } }),
        ]);
        return { notifications, total };
    }

    async getUnreadCount(id_user: number): Promise<number> {
        return prisma.notification.count({
            where: { id_user, is_read: false },
        });
    }

    async markAsRead(id: number, id_user: number): Promise<Notification> {
        return prisma.notification.update({
            where: { id },
            data: { is_read: true },
        });
    }

    async markAllAsRead(id_user: number): Promise<number> {
        const result = await prisma.notification.updateMany({
            where: { id_user, is_read: false },
            data: { is_read: true },
        });
        return result.count;
    }

    async createNotification(data: {
        id_user: number;
        type: Notification_type_enum;
        severity: 'INFO' | 'WARNING' | 'CRITICAL';
        title: string;
        message: string;
        reference_type?: string;
        reference_id?: number;
    }): Promise<Notification> {
        return prisma.notification.create({ data: data as any });
    }

    async existsRecent(
        id_user: number,
        type: Notification_type_enum,
        reference_type: string,
        reference_id: number,
        withinHours = 24
    ): Promise<boolean> {
        const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
        const count = await prisma.notification.count({
            where: {
                id_user,
                type,
                reference_type,
                reference_id,
                created_at: { gte: since },
            },
        });
        return count > 0;
    }
}

export const notificationRepository = new NotificationRepository();
