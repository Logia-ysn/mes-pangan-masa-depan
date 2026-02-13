import { prisma } from '../libs/prisma';
import { notificationRepository } from '../repositories/notification.repository';
import { Notification_type_enum } from '@prisma/client';

class NotificationService {
    async getNotifications(userId: number, limit = 50, offset = 0) {
        return notificationRepository.findByUser(userId, limit, offset);
    }

    async getUnreadCount(userId: number) {
        return notificationRepository.getUnreadCount(userId);
    }

    async markAsRead(id: number, userId: number) {
        return notificationRepository.markAsRead(id, userId);
    }

    async markAllAsRead(userId: number) {
        return notificationRepository.markAllAsRead(userId);
    }

    async checkAndCreateAlerts(userId: number) {
        let created = 0;

        // 1. Low stock alerts
        created += await this.checkLowStock(userId);

        // 2. Overdue invoices
        created += await this.checkOverdueInvoices(userId);

        // 3. Overdue maintenance
        created += await this.checkOverdueMaintenance(userId);

        return { created };
    }

    private async checkLowStock(userId: number): Promise<number> {
        let created = 0;

        const stocks = await prisma.stock.findMany({
            include: { ProductType: true, Factory: true },
        });

        if (stocks.length === 0) return 0;

        const avgQuantity = stocks.reduce((sum, s) => sum + Number(s.quantity), 0) / stocks.length;
        const threshold = Math.max(avgQuantity * 0.3, 5000);

        for (const stock of stocks) {
            const qty = Number(stock.quantity);
            if (qty < threshold) {
                const exists = await notificationRepository.existsRecent(
                    userId,
                    Notification_type_enum.LOW_STOCK,
                    'Stock',
                    stock.id
                );
                if (!exists) {
                    await notificationRepository.createNotification({
                        id_user: userId,
                        type: Notification_type_enum.LOW_STOCK,
                        severity: qty < threshold * 0.3 ? 'CRITICAL' : 'WARNING',
                        title: `Stok rendah: ${stock.ProductType?.name || 'Unknown'}`,
                        message: `Stok ${stock.ProductType?.name} di ${stock.Factory?.name} hanya ${new Intl.NumberFormat('id-ID').format(qty)} kg (batas: ${new Intl.NumberFormat('id-ID').format(Math.round(threshold))} kg)`,
                        reference_type: 'Stock',
                        reference_id: stock.id,
                    });
                    created++;
                }
            }
        }
        return created;
    }

    private async checkOverdueInvoices(userId: number): Promise<number> {
        let created = 0;
        const today = new Date();

        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                due_date: { lt: today },
                status: { in: ['DRAFT', 'SENT', 'PARTIAL'] },
            },
            include: { Customer: true },
        });

        for (const inv of overdueInvoices) {
            const exists = await notificationRepository.existsRecent(
                userId,
                Notification_type_enum.OVERDUE_INVOICE,
                'Invoice',
                inv.id
            );
            if (!exists) {
                const daysOverdue = Math.ceil((today.getTime() - new Date(inv.due_date).getTime()) / 86400000);
                await notificationRepository.createNotification({
                    id_user: userId,
                    type: Notification_type_enum.OVERDUE_INVOICE,
                    severity: daysOverdue > 14 ? 'CRITICAL' : 'WARNING',
                    title: `Invoice jatuh tempo: ${inv.invoice_number}`,
                    message: `Invoice ${inv.invoice_number} untuk ${inv.Customer?.name} telah melewati jatuh tempo ${daysOverdue} hari (Rp ${new Intl.NumberFormat('id-ID').format(Number(inv.total))})`,
                    reference_type: 'Invoice',
                    reference_id: inv.id,
                });
                created++;
            }
        }
        return created;
    }

    private async checkOverdueMaintenance(userId: number): Promise<number> {
        let created = 0;
        const today = new Date();

        const machines = await prisma.machine.findMany({
            where: {
                next_maintenance_date: { lt: today },
                status: { not: 'INACTIVE' },
            },
        });

        for (const machine of machines) {
            const exists = await notificationRepository.existsRecent(
                userId,
                Notification_type_enum.OVERDUE_MAINTENANCE,
                'Machine',
                machine.id
            );
            if (!exists) {
                const daysOverdue = Math.ceil(
                    (today.getTime() - new Date(machine.next_maintenance_date!).getTime()) / 86400000
                );
                await notificationRepository.createNotification({
                    id_user: userId,
                    type: Notification_type_enum.OVERDUE_MAINTENANCE,
                    severity: daysOverdue > 7 ? 'CRITICAL' : 'WARNING',
                    title: `Maintenance terlambat: ${machine.name}`,
                    message: `Mesin ${machine.name} (${machine.code}) sudah melewati jadwal maintenance ${daysOverdue} hari`,
                    reference_type: 'Machine',
                    reference_id: machine.id,
                });
                created++;
            }
        }
        return created;
    }
}

export const notificationService = new NotificationService();
