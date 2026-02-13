import { T_deleteInvoice } from "../types/api/T_deleteInvoice";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { invoiceService } from "../src/services/invoice.service";

export const t_deleteInvoice: T_deleteInvoice = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'ADMIN');
    const { id } = req.path;
    await invoiceService.deleteInvoice(id, user.id);
    return { message: 'Invoice deleted successfully', success: true };
});
