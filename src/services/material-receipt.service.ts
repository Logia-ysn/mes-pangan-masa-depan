import { Prisma, MaterialReceipt_status_enum, StockMovement_movement_type_enum } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { materialReceiptRepository } from '../repositories/material-receipt.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { BusinessRuleError, NotFoundError, ValidationError } from '../utils/errors';

export interface CreateMaterialReceiptDTO {
    id_supplier: number;
    id_factory: number;
    id_product_type: number;
    id_variety?: number;
    receipt_date: string;
    batch_code: string;
    quantity: number;
    unit_price: number;
    other_costs?: number;
    delivery_note_url?: string;
    receipt_url?: string;
    notes?: string;
    // QC data (optional, passed to quality analysis)
    moisture_value?: number;
    density_value?: number;
    green_percentage?: number;
    yellow_percentage?: number;
    damaged_percentage?: number;
    rotten_percentage?: number;
    defect_percentage?: number;
    quality_grade?: string;
}

export interface MarkAsPaidDTO {
    payment_reference?: string;
    payment_method?: 'CASH' | 'TRANSFER' | 'CHECK' | 'GIRO';
}

class MaterialReceiptService {

    /**
     * Operator creates receipt → status WAITING_APPROVAL, stock goes to quarantine
     */
    async create(dto: CreateMaterialReceiptDTO, userId: number): Promise<any> {
        // Validation
        if (!dto.id_supplier || !dto.id_factory || !dto.id_product_type || !dto.quantity || !dto.unit_price) {
            throw new ValidationError('Missing required fields');
        }
        if (dto.quantity <= 0) throw new ValidationError('Quantity must be positive');
        if (dto.unit_price <= 0) throw new ValidationError('Unit price must be positive');

        const totalAmount = dto.quantity * dto.unit_price + (dto.other_costs || 0);

        return await prisma.$transaction(async (tx) => {
            // 1. Generate receipt number: MR-YYYYMMDD-XXXX
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const count = await tx.materialReceipt.count({
                where: {
                    receipt_number: { startsWith: `MR-${dateStr}` }
                }
            });
            const seq = String(count + 1).padStart(4, '0');
            const receiptNumber = `MR-${dateStr}-${seq}`;

            // 2. Get or create Stock record
            let stock = await tx.stock.findFirst({
                where: { id_factory: dto.id_factory, id_product_type: dto.id_product_type }
            });
            if (!stock) {
                const productType = await tx.productType.findUnique({ where: { id: dto.id_product_type } });
                stock = await tx.stock.create({
                    data: {
                        id_factory: dto.id_factory,
                        id_product_type: dto.id_product_type,
                        quantity: 0,
                        quarantine_quantity: 0,
                        unit: productType?.unit || 'kg'
                    }
                });
            }

            // 3. Increment quarantine_quantity (NOT quantity)
            await tx.stock.update({
                where: { id: stock.id },
                data: { quarantine_quantity: { increment: dto.quantity } }
            });

            // 4. Create StockMovement (IN) with reference_type='RAW_MATERIAL_RECEIPT'
            const movement = await tx.stockMovement.create({
                data: {
                    id_stock: stock.id,
                    id_user: userId,
                    movement_type: StockMovement_movement_type_enum.IN,
                    quantity: dto.quantity,
                    reference_type: 'RAW_MATERIAL_RECEIPT',
                    batch_code: dto.batch_code,
                    notes: JSON.stringify({
                        batchId: dto.batch_code,
                        supplier: dto.id_supplier,
                        qualityGrade: dto.quality_grade || '-',
                        moistureContent: dto.moisture_value || 0,
                        density: dto.density_value || 0,
                        pricePerKg: dto.unit_price,
                        otherCosts: dto.other_costs || 0,
                        notes: dto.notes || '',
                        deliveryNoteUrl: dto.delivery_note_url || '',
                        receiptUrl: dto.receipt_url || ''
                    })
                }
            });

            // 5. Create MaterialReceipt record
            const receipt = await tx.materialReceipt.create({
                data: {
                    receipt_number: receiptNumber,
                    id_stock_movement: movement.id,
                    id_supplier: dto.id_supplier,
                    id_factory: dto.id_factory,
                    id_user: userId,
                    id_product_type: dto.id_product_type,
                    id_variety: dto.id_variety || null,
                    receipt_date: new Date(dto.receipt_date),
                    batch_code: dto.batch_code,
                    quantity: dto.quantity,
                    unit_price: dto.unit_price,
                    other_costs: dto.other_costs || 0,
                    total_amount: totalAmount,
                    status: MaterialReceipt_status_enum.WAITING_APPROVAL,
                    delivery_note_url: dto.delivery_note_url,
                    receipt_url: dto.receipt_url,
                    notes: dto.notes
                }
            });

            // 5.5 Create Quality Analysis Record if QC data provided
            if (dto.moisture_value !== undefined || dto.density_value !== undefined || dto.quality_grade) {
                await tx.rawMaterialQualityAnalysis.create({
                    data: {
                        batch_id: dto.batch_code,
                        id_stock_movement: movement.id,
                        moisture_value: dto.moisture_value,
                        density_value: dto.density_value,
                        green_percentage: dto.green_percentage,
                        yellow_percentage: dto.yellow_percentage,
                        damaged_percentage: dto.damaged_percentage,
                        rotten_percentage: dto.rotten_percentage,
                        defect_percentage: dto.defect_percentage,
                        final_grade: dto.quality_grade !== '-' ? dto.quality_grade : undefined,
                        analysis_date: new Date(dto.receipt_date)
                    }
                });
            }

            // 6. Notify managers about pending approval
            const managers = await tx.user.findMany({
                where: {
                    role: { in: ['MANAGER', 'ADMIN', 'SUPERUSER'] },
                    is_active: true,
                    id_factory: dto.id_factory
                }
            });
            for (const manager of managers) {
                await tx.notification.create({
                    data: {
                        id_user: manager.id,
                        type: 'SYSTEM',
                        severity: 'INFO',
                        title: 'Penerimaan Baru Menunggu Approval',
                        message: `Receipt ${receiptNumber} (${dto.batch_code}) menunggu persetujuan Anda.`,
                        reference_type: 'MATERIAL_RECEIPT',
                        reference_id: receipt.id
                    }
                });
            }

            return receipt;
        });
    }

    /**
     * Manager approves → move quarantine to available stock, set APPROVED
     */
    async approve(id: number, userId: number): Promise<any> {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        if (receipt.status !== MaterialReceipt_status_enum.WAITING_APPROVAL) {
            throw new BusinessRuleError(`Cannot approve receipt with status ${receipt.status}`);
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Move from quarantine to available
            const stock = await tx.stock.findFirst({
                where: { id_factory: receipt.id_factory, id_product_type: receipt.id_product_type }
            });
            if (!stock) throw new BusinessRuleError('Stock record not found');

            await tx.stock.update({
                where: { id: stock.id },
                data: {
                    quarantine_quantity: { decrement: Number(receipt.quantity) },
                    quantity: { increment: Number(receipt.quantity) }
                }
            });

            // 2. Update receipt status
            const updated = await tx.materialReceipt.update({
                where: { id },
                data: {
                    status: MaterialReceipt_status_enum.APPROVED,
                    approved_by: userId,
                    approved_at: new Date()
                }
            });

            // 3. Notify operator
            await tx.notification.create({
                data: {
                    id_user: receipt.id_user,
                    type: 'RECEIPT_APPROVED',
                    severity: 'INFO',
                    title: 'Penerimaan Disetujui',
                    message: `Receipt ${receipt.receipt_number} telah disetujui. Stok sudah tersedia untuk produksi.`,
                    reference_type: 'MATERIAL_RECEIPT',
                    reference_id: receipt.id
                }
            });

            return updated;
        });
    }

    /**
     * Accounting marks as paid
     */
    async markAsPaid(id: number, dto: MarkAsPaidDTO, userId: number): Promise<any> {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        if (receipt.status !== MaterialReceipt_status_enum.APPROVED) {
            throw new BusinessRuleError(`Cannot mark as paid. Receipt must be APPROVED first (current: ${receipt.status})`);
        }

        const updated = await prisma.materialReceipt.update({
            where: { id },
            data: {
                status: MaterialReceipt_status_enum.PAID,
                paid_by: userId,
                paid_at: new Date(),
                payment_reference: dto.payment_reference,
                payment_method: dto.payment_method
            }
        });

        // Notify operator
        await notificationRepository.createNotification({
            id_user: receipt.id_user,
            type: 'RECEIPT_PAID',
            severity: 'INFO',
            title: 'Pembayaran Tercatat',
            message: `Receipt ${receipt.receipt_number} telah dicatat pembayarannya.`,
            reference_type: 'MATERIAL_RECEIPT',
            reference_id: receipt.id
        });

        return updated;
    }

    /**
     * Get by ID with all relations
     */
    async getById(id: number) {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        return receipt;
    }

    /**
     * List with filters and pagination
     */
    async getAll(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        id_supplier?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
    }) {
        return await materialReceiptRepository.findWithFilters(params);
    }

    /**
     * Update receipt (only WAITING_APPROVAL)
     */
    async update(id: number, data: Partial<CreateMaterialReceiptDTO>, userId: number) {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        if (receipt.status !== MaterialReceipt_status_enum.WAITING_APPROVAL) {
            throw new BusinessRuleError('Can only edit receipts with WAITING_APPROVAL status');
        }

        // If quantity changed, update quarantine
        if (data.quantity !== undefined && data.quantity !== Number(receipt.quantity)) {
            const diff = data.quantity - Number(receipt.quantity);
            const stock = await prisma.stock.findFirst({
                where: { id_factory: receipt.id_factory, id_product_type: receipt.id_product_type }
            });
            if (stock) {
                await prisma.stock.update({
                    where: { id: stock.id },
                    data: { quarantine_quantity: { increment: diff } }
                });
            }
            // Also update the StockMovement quantity
            await prisma.stockMovement.update({
                where: { id: receipt.id_stock_movement },
                data: { quantity: data.quantity }
            });
        }

        const totalAmount = (data.quantity || Number(receipt.quantity)) * (data.unit_price || Number(receipt.unit_price)) + (data.other_costs ?? Number(receipt.other_costs));

        // Update QC Analysis if required
        if (data.moisture_value !== undefined || data.density_value !== undefined || data.green_percentage !== undefined || data.quality_grade) {
            const existingQC = await prisma.rawMaterialQualityAnalysis.findFirst({
                where: { id_stock_movement: receipt.id_stock_movement }
            });

            const qcPayload = {
                moisture_value: data.moisture_value,
                density_value: data.density_value,
                green_percentage: data.green_percentage,
                yellow_percentage: data.yellow_percentage,
                damaged_percentage: data.damaged_percentage,
                rotten_percentage: data.rotten_percentage,
                defect_percentage: data.defect_percentage,
                final_grade: data.quality_grade !== '-' ? data.quality_grade : undefined
            };

            if (existingQC) {
                await prisma.rawMaterialQualityAnalysis.update({
                    where: { id: existingQC.id },
                    data: qcPayload
                });
            } else {
                await prisma.rawMaterialQualityAnalysis.create({
                    data: {
                        ...qcPayload,
                        batch_id: receipt.batch_code,
                        id_stock_movement: receipt.id_stock_movement,
                        analysis_date: receipt.receipt_date
                    }
                });
            }
        }

        return await prisma.materialReceipt.update({
            where: { id },
            data: {
                ...(data.id_supplier && { id_supplier: data.id_supplier }),
                ...(data.id_product_type && { id_product_type: data.id_product_type }),
                ...(data.id_variety !== undefined && { id_variety: data.id_variety }),
                ...(data.receipt_date && { receipt_date: new Date(data.receipt_date) }),
                ...(data.quantity && { quantity: data.quantity }),
                ...(data.unit_price && { unit_price: data.unit_price }),
                ...(data.other_costs !== undefined && { other_costs: data.other_costs }),
                total_amount: totalAmount,
                ...(data.delivery_note_url !== undefined && { delivery_note_url: data.delivery_note_url }),
                ...(data.receipt_url !== undefined && { receipt_url: data.receipt_url }),
                ...(data.notes !== undefined && { notes: data.notes })
            }
        });
    }

    /**
     * Delete receipt (only WAITING_APPROVAL, reverses quarantine)
     */
    async delete(id: number) {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        if (receipt.status !== MaterialReceipt_status_enum.WAITING_APPROVAL) {
            throw new BusinessRuleError('Can only delete receipts with WAITING_APPROVAL status');
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Reverse quarantine stock
            const stock = await tx.stock.findFirst({
                where: { id_factory: receipt.id_factory, id_product_type: receipt.id_product_type }
            });
            if (stock) {
                await tx.stock.update({
                    where: { id: stock.id },
                    data: { quarantine_quantity: { decrement: Number(receipt.quantity) } }
                });
            }

            // 2. Delete related QualityAnalysis if exists
            await tx.rawMaterialQualityAnalysis.deleteMany({
                where: { id_stock_movement: receipt.id_stock_movement }
            });

            // 3. Delete the MaterialReceipt
            await tx.materialReceipt.delete({ where: { id } });

            // 4. Delete the StockMovement
            await tx.stockMovement.delete({ where: { id: receipt.id_stock_movement } });

            return true;
        });
    }
}

export const materialReceiptService = new MaterialReceiptService();
