import { T_updateSupplier } from "../types/api/T_updateSupplier";
import { Supplier } from "../types/model/table/Supplier";
import { getUserFromToken } from "../utility/auth";

export const t_updateSupplier: T_updateSupplier = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { id } = req.path;
    const supplier = await Supplier.findOne({ where: { id } });
    if (!supplier) throw new Error('Supplier not found');
    const { code, name, contact_person, phone, email, address, is_active } = req.body;
    if (code !== undefined) supplier.code = code;
    if (name !== undefined) supplier.name = name;
    if (contact_person !== undefined) supplier.contact_person = contact_person;
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;
    if (is_active !== undefined) supplier.is_active = is_active;
    await supplier.save();
    return supplier;
}
