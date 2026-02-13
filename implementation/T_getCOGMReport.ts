import { T_getCOGMReport } from "../types/api/T_getCOGMReport";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { prisma } from "../src/libs/prisma";

export const t_getCOGMReport: T_getCOGMReport = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const { id_factory, start_date, end_date } = req.query;

  const where: any = {
    worksheet_date: {
      gte: new Date(start_date as string),
      lte: new Date(end_date as string),
    },
  };
  if (id_factory) where.id_factory = Number(id_factory);

  const worksheets = await prisma.worksheet.findMany({
    where,
    include: {
      WorksheetInputBatch: true,
      WorksheetSideProduct: true,
    },
  });

  // Calculate cost breakdown
  const raw_material_cost = worksheets.reduce(
    (sum, w) => sum + Number(w.raw_material_cost || 0),
    0
  );
  const production_cost = worksheets.reduce(
    (sum, w) => sum + Number(w.production_cost || 0),
    0
  );
  const side_product_revenue = worksheets.reduce(
    (sum, w) => sum + Number(w.side_product_revenue || 0),
    0
  );

  const total_production_cost = raw_material_cost + production_cost - side_product_revenue;
  const total_beras_output = worksheets.reduce(
    (sum, w) => sum + Number(w.beras_output),
    0
  );
  const cost_per_kg = total_beras_output > 0
    ? total_production_cost / total_beras_output
    : 0;

  const breakdown = [
    { category: 'Bahan Baku', amount: raw_material_cost },
    { category: 'Biaya Produksi', amount: production_cost },
    { category: 'Pendapatan Produk Samping', amount: -side_product_revenue },
  ].filter((b) => b.amount !== 0);

  return {
    total_production_cost,
    total_beras_output,
    cost_per_kg,
    breakdown,
  };
});
