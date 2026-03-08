import { prisma } from '../libs/prisma';
import { productionEventBus, EVENTS, WorksheetStatusChangedPayload } from './production-event-bus';
import { WorkOrder_status_enum } from '@prisma/client';

/**
 * Work Order Listener
 * 
 * Auto-syncs Work Order status based on worksheet status changes:
 * - When ALL worksheets in a WO are APPROVED/COMPLETED → auto-complete the WO
 * - When a worksheet is active and WO is still PLANNED → auto-start the WO
 */

function registerWorkOrderListeners() {
    productionEventBus.on(EVENTS.WORKSHEET_STATUS_CHANGED, async (payload: WorksheetStatusChangedPayload) => {
        if (!payload.workOrderId) return;

        try {
            const wo = await prisma.workOrder.findUnique({
                where: { id: payload.workOrderId },
                include: {
                    Worksheet: { select: { id: true, status: true } }
                }
            });

            if (!wo) return;

            // Skip if WO is already completed or cancelled
            if (wo.status === WorkOrder_status_enum.COMPLETED || wo.status === WorkOrder_status_enum.CANCELLED) {
                return;
            }

            const worksheets = wo.Worksheet;
            if (worksheets.length === 0) return;

            const allApprovedOrCompleted = worksheets.every((ws: { status: string }) =>
                ['APPROVED', 'COMPLETED'].includes(ws.status)
            );
            const anyInProgress = worksheets.some((ws: { status: string }) =>
                ['SUBMITTED', 'IN_PROGRESS'].includes(ws.status)
            );

            if (allApprovedOrCompleted) {
                // All worksheets approved/completed → complete the WO
                await prisma.workOrder.update({
                    where: { id: wo.id },
                    data: {
                        status: WorkOrder_status_enum.COMPLETED,
                        actual_end: new Date(),
                    }
                });

                productionEventBus.emitWorkOrderStatusChange({
                    workOrderId: wo.id,
                    oldStatus: wo.status,
                    newStatus: WorkOrder_status_enum.COMPLETED,
                    userId: payload.userId,
                });

                console.log(`[EventSystem] Auto-completed WorkOrder #${wo.id} (${wo.work_order_number})`);
            } else if ((anyInProgress || payload.newStatus === 'APPROVED') && wo.status === WorkOrder_status_enum.PLANNED) {
                // Worksheet activity started → auto-start the WO
                await prisma.workOrder.update({
                    where: { id: wo.id },
                    data: {
                        status: WorkOrder_status_enum.IN_PROGRESS,
                        actual_start: new Date(),
                    }
                });

                productionEventBus.emitWorkOrderStatusChange({
                    workOrderId: wo.id,
                    oldStatus: wo.status,
                    newStatus: WorkOrder_status_enum.IN_PROGRESS,
                    userId: payload.userId,
                });

                console.log(`[EventSystem] Auto-started WorkOrder #${wo.id} (${wo.work_order_number})`);
            }
        } catch (err) {
            console.error(`[EventSystem] Error processing WO #${payload.workOrderId}:`, err);
        }
    });

    console.log('[EventSystem] Work Order listeners registered');
}

export { registerWorkOrderListeners };
