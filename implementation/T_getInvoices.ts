import { T_getInvoices } from "../types/api/T_getInvoices";
import { invoiceRepository } from "../src/repositories/invoice.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getInvoices: T_getInvoices = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_factory, id_customer, status, start_date, end_date } = req.query;

    const { data, total } = await invoiceRepository.findWithFilters({
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
        id_factory: id_factory ? Number(id_factory) : undefined,
        id_customer: id_customer ? Number(id_customer) : undefined,
        status: status as string,
        start_date: start_date as string,
        end_date: end_date as string
    });

    return { data: data as any, total };
});
