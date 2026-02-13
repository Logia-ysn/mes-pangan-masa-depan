import { T_updateStock } from "../types/api/T_updateStock";
import { stockRepository } from "../src/repositories/stock.repository";
import { requireAuth } from "../utility/auth";
import { prisma } from "../src/libs/prisma";
import { stockService } from "../src/services/stock.service";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateStock: T_updateStock = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'SUPERVISOR');

  const stockId = Number(req.path.id);
  const stock = await stockRepository.findById(stockId);
  if (!stock) throw new Error('Stock not found');

  // Need product code for stockService
  const productType = await prisma.productType.findUnique({ where: { id: stock.id_product_type } });
  if (!productType) throw new Error('Product Type not found');

  const { quantity, notes } = req.body;
  if (quantity === undefined) throw new Error('Quantity is required');

  // Use StockService to ensure StockMovement (Audit Log) is created
  const diff = Number(quantity) - Number(stock.quantity);
  if (diff === 0) return stock as any;

  const updatedStock = await stockService.updateStock({
    factoryId: stock.id_factory,
    productCode: productType.code,
    quantity: Math.abs(diff),
    movementType: diff > 0 ? 'IN' : 'OUT',
    userId: user.id,
    referenceType: 'MANUAL_ADJUSTMENT',
    notes: notes || 'Pembaruan stok manual oleh supervisor'
  });

  return updatedStock as any;
});
