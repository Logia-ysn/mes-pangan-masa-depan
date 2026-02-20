
import { T_createStockMovement } from "../types/api/T_createStockMovement";
import { apiWrapper } from "../src/utils/apiWrapper";
import { StockMovement_movement_type_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { prisma } from "../src/libs/prisma";
import { BusinessRuleError } from "../src/utils/errors";

export const t_createStockMovement: T_createStockMovement = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'OPERATOR');
  let { id_stock, movement_type, quantity, reference_type, reference_id, notes, empty_weight, price_per_kg, other_costs } = req.body;

  const qty = Number(quantity);
  const emptyQty = empty_weight !== undefined ? Number(empty_weight) : null;
  const priceQty = price_per_kg !== undefined ? Number(price_per_kg) : null;
  const otherQty = other_costs !== undefined ? Number(other_costs) : null;

  if (qty <= 0) throw new BusinessRuleError('Quantity must be positive');

  return await prisma.$transaction(async (tx) => {
    // Lock row by reading inside transaction
    const stock = await tx.stock.findUnique({ where: { id: id_stock } });
    if (!stock) throw new BusinessRuleError('Stock not found');

    // Calculate new quantity
    let newQuantity: number;
    if (movement_type === 'IN') {
      newQuantity = Number(stock.quantity) + qty;
    } else if (movement_type === 'OUT') {
      newQuantity = Number(stock.quantity) - qty;
      if (newQuantity < 0) {
        throw new BusinessRuleError(
          `Insufficient stock. Available: ${stock.quantity}, Requested: ${qty}`
        );
      }
    } else if (movement_type === 'ADJUSTMENT') {
      newQuantity = qty;
    } else {
      throw new BusinessRuleError(`Invalid movement type: ${movement_type}`);
    }

    // Create movement record
    const movement = await tx.stockMovement.create({
      data: {
        id_stock,
        id_user: user.id,
        movement_type: movement_type as StockMovement_movement_type_enum,
        quantity: qty,
        reference_type,
        reference_id: reference_id !== undefined ? BigInt(reference_id) : null,
        notes,
        empty_weight: emptyQty,
        price_per_kg: priceQty,
        other_costs: otherQty
      }
    });

    // Update stock quantity atomically
    await tx.stock.update({
      where: { id: id_stock },
      data: { quantity: newQuantity }
    });

    return movement;
  });
});
