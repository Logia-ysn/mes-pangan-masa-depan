import { T_getInvoice } from "../types/api/T_getInvoice";
import { requireAuth } from "../utility/auth";
import { invoiceRepository } from "../src/repositories/invoice.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getInvoice: T_getInvoice = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { id } = req.path;
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) throw new Error('Invoice not found');
    return invoice as any;
});
