import { T_addInvoiceItem } from "../types/api/T_addInvoiceItem";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { invoiceService } from "../src/services/invoice.service";

export const t_addInvoiceItem: T_addInvoiceItem = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id } = req.path;
    const result = await invoiceService.addItem(id, req.body, user.id);
    return result as any;
});
