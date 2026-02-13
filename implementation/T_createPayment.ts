import { T_createPayment } from "../types/api/T_createPayment";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { invoiceService } from "../src/services/invoice.service";

export const t_createPayment: T_createPayment = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id_invoice, payment_date, amount, payment_method, reference_number, notes } = req.body;
    const result = await invoiceService.addPayment(
        id_invoice,
        { payment_date, amount, payment_method, reference_number, notes },
        user.id
    );
    return result as any;
});
