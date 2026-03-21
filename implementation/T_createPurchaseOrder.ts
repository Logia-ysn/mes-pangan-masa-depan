import { T_createPurchaseOrder } from "../types/api/T_createPurchaseOrder";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { purchaseOrderService } from "../src/services/purchase-order.service";
import { ValidationError } from "../src/utils/errors";

export const t_createPurchaseOrder: T_createPurchaseOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');

    // 1. Validation
    const { id_factory, id_supplier, order_date, items, pricing_type } = req.body;

    if (!id_factory) throw new ValidationError('Factory ID is required');
    
    // id_supplier is mandatory for STANDARD PO, but optional for PLAFON (can be general/UMUM)
    if (pricing_type !== 'PLAFON' && !id_supplier) {
        throw new ValidationError('Supplier ID is required');
    }
    
    if (!order_date) throw new ValidationError('Order date is required');
    if (pricing_type !== 'PLAFON' && (!items || !Array.isArray(items) || items.length === 0)) {
        throw new ValidationError('At least one item is required');
    }

    // 2. Execution
    const result = await purchaseOrderService.createPO(req.body, user.id);
    return result as any;
});
