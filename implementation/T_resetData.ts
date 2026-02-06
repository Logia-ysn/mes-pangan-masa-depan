import { T_resetData } from "../types/api/T_resetData";
import { Worksheet } from "../types/model/table/Worksheet";
import { StockMovement } from "../types/model/table/StockMovement";
import { Stock } from "../types/model/table/Stock";
import { Maintenance } from "../types/model/table/Maintenance";
import { Employee } from "../types/model/table/Employee";
import { Machine } from "../types/model/table/Machine";
import { Supplier } from "../types/model/table/Supplier";
import { RawMaterialCategory } from "../types/model/table/RawMaterialCategory";
import { RawMaterialVariety } from "../types/model/table/RawMaterialVariety";
import { ProductType } from "../types/model/table/ProductType";
import { WorksheetSideProduct } from "../types/model/table/WorksheetSideProduct";
import { WorksheetInputBatch } from "../types/model/table/WorksheetInputBatch";

export const t_resetData: T_resetData = async (req, res) => {
    // Delete in order of dependencies (Children first)
    try {
        // Use createQueryBuilder for mass deletion to avoid "Empty criteria" error
        await StockMovement.createQueryBuilder().delete().execute();
        await WorksheetSideProduct.createQueryBuilder().delete().execute();
        await WorksheetInputBatch.createQueryBuilder().delete().execute();
        await Worksheet.createQueryBuilder().delete().execute();
        await Maintenance.createQueryBuilder().delete().execute();

        // Reset Stocks to 0 instead of deleting
        await Stock.createQueryBuilder().update().set({ quantity: 0 }).execute();

        // NOTE: Master Data is PRESERVED (User, Employee, Machine, ProductType, etc)

        return { message: "Data transaksi berhasil dihapus. Master data tersimpan." };
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500);
        return { message: "Error resetting data: " + (error as any).message };
    }
}

