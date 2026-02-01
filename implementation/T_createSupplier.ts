import { T_createSupplier } from "../types/api/T_createSupplier";
import { Supplier } from "../types/model/table/Supplier";
import { getUserFromToken } from "../utility/auth";

export const t_createSupplier: T_createSupplier = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { code, name, contact_person, phone, email, address } = req.body;

    // Check for duplicate code
    const existing = await Supplier.findOne({ where: { code } });
    if (existing) {
        res.status(400).json({ message: `Kode Supplier "${code}" sudah digunakan. Gunakan kode lain.` });
        return null as any;
    }

    const supplier = new Supplier();
    supplier.code = code;
    supplier.name = name;
    supplier.contact_person = contact_person;
    supplier.phone = phone;
    supplier.email = email;
    supplier.address = address;
    supplier.is_active = true;
    await supplier.save();
    return supplier;
}
