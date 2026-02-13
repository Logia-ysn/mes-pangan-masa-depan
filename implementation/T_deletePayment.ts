import { T_deletePayment } from "../types/api/T_deletePayment";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { invoiceService } from "../src/services/invoice.service";

export const t_deletePayment: T_deletePayment = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'ADMIN');
    const { id } = req.path;
    await invoiceService.deletePayment(id, user.id);
    return { message: 'Payment deleted successfully', success: true };
});
