import { T_createStockMovement } from "../types/api/T_createStockMovement";
import { StockMovement } from "../types/model/table/StockMovement";
import { Stock } from "../types/model/table/Stock";
import { getUserFromToken } from "../utility/auth";
import { MovementType } from "../types/model/enum/MovementType";

export const t_createStockMovement: T_createStockMovement = async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  const { id_stock, movement_type, quantity, reference_type, reference_id, notes } = req.body;

  const stock = await Stock.findOne({ where: { id: id_stock } });
  if (!stock) throw new Error('Stock not found');

  const movement = new StockMovement();
  movement.id_stock = id_stock;
  movement.id_user = user.id;
  movement.movement_type = movement_type as MovementType;
  movement.quantity = quantity;
  movement.reference_type = reference_type;
  movement.reference_id = reference_id;
  movement.notes = notes;

  // Update stock quantity based on movement type
  if (movement_type === 'IN') {
    stock.quantity = Number(stock.quantity) + Number(quantity);
  } else if (movement_type === 'OUT') {
    stock.quantity = Number(stock.quantity) - Number(quantity);
  } else if (movement_type === 'ADJUSTMENT') {
    stock.quantity = quantity;
  }
  stock.updated_at = new Date();

  await movement.save();
  await stock.save();

  return movement;
}
