import { T_getPayments } from "../types/api/T_getPayments";
import { paymentRepository } from "../src/repositories/payment.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getPayments: T_getPayments = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_invoice, payment_method, start_date, end_date } = req.query;

    const { data, total } = await paymentRepository.findWithFilters({
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
        id_invoice: id_invoice ? Number(id_invoice) : undefined,
        payment_method: payment_method as string,
        start_date: start_date as string,
        end_date: end_date as string
    });

    return { data: data as any, total };
});
