
import { Employee_gender_enum } from "@prisma/client";

export const dummyFactories = [
    {
        code: "PMD-1",
        name: "PMD 1",
        address: "Jl. Raya Padi No. 1, Karawang",
        phone: "08123456789"
    },
    {
        code: "PMD-2",
        name: "PMD 2",
        address: "Jl. Raya Beras No. 2, Subang",
        phone: "08123456790"
    }
];

export const dummyCategories = ["Bahan Bakar", "Gaji", "Maintenance", "Operasional", "Lain-lain"];

export const dummyCustomers = [
    { name: "Toko Beras Makmur", address: "Pasar Induk", phone: "08111111" },
    { name: "CV Pangan Sejahtera", address: "Jakarta", phone: "08222222" },
    { name: "Warung Bu Siti", address: "Desa Sukamaju", phone: "08333333" }
];

export const dummyEmployees = [
    { fullname: "Budi Santoso", position: "Operator", phone: "085555", gender: Employee_gender_enum.MALE },
    { fullname: "Siti Aminah", position: "Admin", phone: "086666", gender: Employee_gender_enum.FEMALE },
    { fullname: "Joko Widodo", position: "Teknisi", phone: "087777", gender: Employee_gender_enum.MALE }
];

export const dummyMachines = [
    {
        code: "MSN-001",
        name: "Mesin Husker A1",
        machine_type: "Husker",
        serial_number: "SN-2023-001",
        manufacture_year: 2023,
        capacity_per_hour: 1000
    },
    {
        code: "MSN-002",
        name: "Mesin Polisher B2",
        machine_type: "Polisher",
        serial_number: "SN-2022-002",
        manufacture_year: 2022,
        capacity_per_hour: 800
    },
    {
        code: "MSN-003",
        name: "Mesin Separator C3",
        machine_type: "Separator",
        serial_number: "SN-2024-003",
        manufacture_year: 2024,
        capacity_per_hour: 1200
    }
];

export const dummySuppliers = [
    { code: "SUP-001", name: "PT Mesin Indonesia", contact_person: "Ahmad", phone: "081234567890" },
    { code: "SUP-002", name: "CV Teknik Sejahtera", contact_person: "Budi", phone: "082345678901" },
    { code: "SUP-003", name: "UD Padi Jaya", contact_person: "Cahyo", phone: "083456789012" }
];
