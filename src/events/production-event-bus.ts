import { EventEmitter } from 'events';

// Event Names
export const EVENTS = {
    WORKSHEET_STATUS_CHANGED: 'worksheet.status.changed',
    WORKSHEET_APPROVED: 'worksheet.approved',
    WORKSHEET_REJECTED: 'worksheet.rejected',
    WORKSHEET_SUBMITTED: 'worksheet.submitted',
    WORKSHEET_CANCELLED: 'worksheet.cancelled',
    WORKSHEET_COMPLETED: 'worksheet.completed',
    WORK_ORDER_STARTED: 'workOrder.started',
    WORK_ORDER_COMPLETED: 'workOrder.completed',
    WORK_ORDER_CANCELLED: 'workOrder.cancelled',
} as const;

// Event Payloads
export interface WorksheetStatusChangedPayload {
    worksheetId: number;
    workOrderId?: number | null;
    oldStatus: string;
    newStatus: string;
    userId: number;
    factoryId: number;
}

export interface WorkOrderStatusChangedPayload {
    workOrderId: number;
    oldStatus: string;
    newStatus: string;
    userId: number;
}

// Typed Event Bus
class ProductionEventBus extends EventEmitter {
    emitWorksheetStatusChange(payload: WorksheetStatusChangedPayload) {
        this.emit(EVENTS.WORKSHEET_STATUS_CHANGED, payload);

        // Emit specific event based on new status
        const specificEvent: Record<string, string> = {
            'SUBMITTED': EVENTS.WORKSHEET_SUBMITTED,
            'APPROVED': EVENTS.WORKSHEET_APPROVED,
            'REJECTED': EVENTS.WORKSHEET_REJECTED,
            'CANCELLED': EVENTS.WORKSHEET_CANCELLED,
            'COMPLETED': EVENTS.WORKSHEET_COMPLETED,
        };
        if (specificEvent[payload.newStatus]) {
            this.emit(specificEvent[payload.newStatus], payload);
        }
    }

    emitWorkOrderStatusChange(payload: WorkOrderStatusChangedPayload) {
        const specificEvent: Record<string, string> = {
            'IN_PROGRESS': EVENTS.WORK_ORDER_STARTED,
            'COMPLETED': EVENTS.WORK_ORDER_COMPLETED,
            'CANCELLED': EVENTS.WORK_ORDER_CANCELLED,
        };
        if (specificEvent[payload.newStatus]) {
            this.emit(specificEvent[payload.newStatus], payload);
        }
    }
}

export const productionEventBus = new ProductionEventBus();
