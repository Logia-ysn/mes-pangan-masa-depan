import { T_getInvoice } from "../types/api/T_getInvoice";
import { requireAuth } from "../utility/auth";
import { invoiceRepository } from "../src/repositories/invoice.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getInvoice: T_getInvoice = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const id = Number(req.path.id);
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) return res.status(404).json({ success: false, error: { message: 'Invoice not found' } });
    return invoice as any;
});
