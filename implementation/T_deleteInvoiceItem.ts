import { T_deleteInvoiceItem } from "../types/api/T_deleteInvoiceItem";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { invoiceService } from "../src/services/invoice.service";

export const t_deleteInvoiceItem: T_deleteInvoiceItem = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id } = req.path;
    await invoiceService.removeItem(id, user.id);
    return { message: 'Invoice item deleted successfully', success: true };
});
