import { productionEventBus, EVENTS, NCREventPayload } from './production-event-bus';
import { prisma } from '../libs/prisma';
import { notificationRepository } from '../repositories/notification.repository';
import { Notification_type_enum } from '@prisma/client';

function registerNCRListeners() {
    productionEventBus.on(EVENTS.NCR_CREATED, async (payload: NCREventPayload) => {
        try {
            if (payload.severity === 'CRITICAL') {
                const admins = await prisma.user.findMany({
                    where: { role: { in: ['ADMIN', 'SUPERUSER', 'SUPERVISOR'] }, is_active: true }
                });

                for (const admin of admins) {
                    await notificationRepository.createNotification({
                        id_user: admin.id,
                        type: Notification_type_enum.SYSTEM,
                        severity: 'CRITICAL',
                        title: `NCR CRITICAL Dibuat: ${payload.reportNumber}`,
                        message: `Terdapat temuan Non-Conformance Report (${payload.reportNumber}) berstatus CRITICAL yang memerlukan perhatian segera.`,
                        reference_type: 'NonConformanceReport',
                        reference_id: payload.ncrId,
                    });
                }
                console.log(`[EventSystem] Emitted CRITICAL NCR notification for ${payload.reportNumber}`);
            }
        } catch (err) {
            console.error(`[EventSystem] Error processing NCR_CREATED event for ${payload.reportNumber}:`, err);
        }
    });

    productionEventBus.on(EVENTS.NCR_RESOLVED, async (payload: NCREventPayload) => {
        console.log(`[EventSystem] NCR ${payload.reportNumber} has been resolved.`);
    });

    console.log('[EventSystem] NCR listeners registered');
}

export { registerNCRListeners };
