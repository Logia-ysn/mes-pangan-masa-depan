import { T_updateInvoice } from "../types/api/T_updateInvoice";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { invoiceService } from "../src/services/invoice.service";

export const t_updateInvoice: T_updateInvoice = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id } = req.path;
    const result = await invoiceService.updateInvoice(id, req.body, user.id);
    return result as any;
});
