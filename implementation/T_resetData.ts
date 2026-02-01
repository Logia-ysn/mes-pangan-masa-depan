import { T_resetData } from "../types/api/T_resetData";
import { Worksheet } from "../types/model/table/Worksheet";
import { StockMovement } from "../types/model/table/StockMovement";
import { Stock } from "../types/model/table/Stock";
import { InvoiceItem } from "../types/model/table/InvoiceItem";
import { Invoice } from "../types/model/table/Invoice";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { Attendance } from "../types/model/table/Attendance";
import { Maintenance } from "../types/model/table/Maintenance";
import { Payment } from "../types/model/table/Payment";
import { Customer } from "../types/model/table/Customer";
import { Employee } from "../types/model/table/Employee";
import { Machine } from "../types/model/table/Machine";
import { Supplier } from "../types/model/table/Supplier";
import { RawMaterialCategory } from "../types/model/table/RawMaterialCategory";
import { RawMaterialVariety } from "../types/model/table/RawMaterialVariety";
import { ProductType } from "../types/model/table/ProductType";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { WorksheetSideProduct } from "../types/model/table/WorksheetSideProduct";
import { WorksheetInputBatch } from "../types/model/table/WorksheetInputBatch";

export const t_resetData: T_resetData = async (req, res) => {
    // Delete in order of dependencies (Children first)
    try {
        // Use createQueryBuilder for mass deletion to avoid "Empty criteria" error
        await Payment.createQueryBuilder().delete().execute();
        await InvoiceItem.createQueryBuilder().delete().execute();
        await Invoice.createQueryBuilder().delete().execute();

        await StockMovement.createQueryBuilder().delete().execute();
        await WorksheetSideProduct.createQueryBuilder().delete().execute();
        await WorksheetInputBatch.createQueryBuilder().delete().execute();
        await Worksheet.createQueryBuilder().delete().execute();

        await DailyExpense.createQueryBuilder().delete().execute();
        await Attendance.createQueryBuilder().delete().execute();
        await Maintenance.createQueryBuilder().delete().execute();

        // Master Data
        await Stock.createQueryBuilder().delete().execute();
        await Customer.createQueryBuilder().delete().execute();
        await Employee.createQueryBuilder().delete().execute();
        await Machine.createQueryBuilder().delete().execute();
        await Supplier.createQueryBuilder().delete().execute();
        await RawMaterialCategory.createQueryBuilder().delete().execute();
        await RawMaterialVariety.createQueryBuilder().delete().execute();
        await ProductType.createQueryBuilder().delete().execute();
        await ExpenseCategory.createQueryBuilder().delete().execute();

        return { message: "Semua data dummy berhasil dihapus." };
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500);
        return { message: "Error resetting data: " + (error as any).message };
    }
}

