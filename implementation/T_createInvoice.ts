import { T_createInvoice } from "../types/api/T_createInvoice";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { invoiceService } from "../src/services/invoice.service";
import { ValidationError } from "../src/utils/errors";

export const t_createInvoice: T_createInvoice = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');

    // 1. Validation
    const { id_factory, id_customer, invoice_date, due_date, items } = req.body;

    if (!id_factory) throw new ValidationError('Factory ID is required');
    if (!id_customer) throw new ValidationError('Customer ID is required');
    if (!invoice_date) throw new ValidationError('Invoice date is required');
    if (!due_date) throw new ValidationError('Due date is required');
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('At least one item is required');
    }

    // 2. Execution
    const result = await invoiceService.createInvoice(req.body, user.id);
    return result as any;
});
