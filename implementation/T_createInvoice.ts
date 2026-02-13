import { T_createInvoice } from "../types/api/T_createInvoice";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { invoiceService } from "../src/services/invoice.service";

export const t_createInvoice: T_createInvoice = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const result = await invoiceService.createInvoice(req.body, user.id);
    return result as any;
});
