import { T_getStockReport } from "../types/api/T_getStockReport";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { prisma } from "../src/libs/prisma";

export const t_getStockReport: T_getStockReport = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const { id_factory, start_date, end_date } = req.query;

  const where: any = {
    created_at: {
      gte: new Date(start_date as string),
      lte: new Date(end_date as string),
    },
  };

  if (id_factory) {
    where.Stock = { id_factory: Number(id_factory) };
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      Stock: {
        include: { ProductType: true },
      },
    },
  });

  const total_in = movements
    .filter((m) => m.movement_type === 'IN')
    .reduce((sum, m) => sum + Number(m.quantity), 0);

  const total_out = movements
    .filter((m) => m.movement_type === 'OUT')
    .reduce((sum, m) => sum + Number(m.quantity), 0);

  // Group by type
  const typeMap = new Map<string, { total_quantity: number; count: number }>();
  movements.forEach((m) => {
    const existing = typeMap.get(m.movement_type) || { total_quantity: 0, count: 0 };
    existing.total_quantity += Number(m.quantity);
    existing.count += 1;
    typeMap.set(m.movement_type, existing);
  });

  const movements_by_type = Array.from(typeMap.entries()).map(
    ([movement_type, data]) => ({
      movement_type,
      total_quantity: data.total_quantity,
      count: data.count,
    })
  );

  // Group by product
  const productMap = new Map<string, { total_in: number; total_out: number }>();
  movements.forEach((m) => {
    const productName = (m.Stock as any)?.ProductType?.name || 'Unknown';
    const existing = productMap.get(productName) || { total_in: 0, total_out: 0 };
    if (m.movement_type === 'IN') {
      existing.total_in += Number(m.quantity);
    } else if (m.movement_type === 'OUT') {
      existing.total_out += Number(m.quantity);
    }
    productMap.set(productName, existing);
  });

  const movements_by_product = Array.from(productMap.entries()).map(
    ([product_name, data]) => ({
      product_name,
      total_in: data.total_in,
      total_out: data.total_out,
    })
  );

  return {
    total_in,
    total_out,
    movements_by_type,
    movements_by_product,
  };
});
