import { T_createInvoiceItem } from "../types/api/T_createInvoiceItem";
import { InvoiceItem } from "../types/model/table/InvoiceItem";
import { Invoice } from "../types/model/table/Invoice";
import { Stock } from "../types/model/table/Stock";
import { StockMovement } from "../types/model/table/StockMovement";
import { getUserFromToken } from "../utility/auth";
import { MovementType } from "../types/model/enum/MovementType";

export const t_createInvoiceItem: T_createInvoiceItem = async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  const invoice = await Invoice.findOne({ where: { id: req.path.id } });
  if (!invoice) throw new Error('Invoice not found');

  const { id_product_type, quantity, unit_price, subtotal } = req.body;

  const item = new InvoiceItem();
  item.id_invoice = req.path.id;
  item.id_product_type = id_product_type;
  item.quantity = quantity;
  item.unit_price = unit_price;
  item.subtotal = subtotal;
  await item.save();

  // Update invoice totals
  invoice.subtotal = Number(invoice.subtotal) + Number(subtotal);
  invoice.total = Number(invoice.subtotal) + Number(invoice.tax) - Number(invoice.discount);
  invoice.updated_at = new Date();
  await invoice.save();

  // === REDUCE STOCK FOR SOLD ITEM ===
  const stock = await Stock.findOne({
    where: { id_factory: invoice.id_factory, id_product_type }
  });

  if (stock && quantity > 0) {
    stock.quantity = Number(stock.quantity) - quantity;
    stock.updated_at = new Date();
    await stock.save();

    // Create stock movement record
    const movement = new StockMovement();
    movement.id_stock = stock.id;
    movement.id_user = user.id;
    movement.movement_type = MovementType.OUT;
    movement.quantity = quantity;
    movement.reference_type = 'INVOICE';
    movement.reference_id = invoice.id;
    movement.notes = JSON.stringify({
      type: 'SALES',
      invoice_number: invoice.invoice_number,
      item_id: item.id
    });
    await movement.save();
  }

  return item;
}

