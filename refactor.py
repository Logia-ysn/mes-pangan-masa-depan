import os
import re

file_path = "/Users/yay/Project/erp-pangan-masa-depan/frontend/src/pages/production/RawMaterialReceipt.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import api, { stockApi, supplierApi, productTypeApi, rawMaterialCategoryApi, riceVarietyApi, qualityAnalysisApi } from '../../services/api';",
    "import api, { stockApi, supplierApi, productTypeApi, rawMaterialCategoryApi, riceVarietyApi, qualityAnalysisApi, materialReceiptApi } from '../../services/api';"
)

# 2. State and Interfaces
content = content.replace(
    "const [editingId, setEditingId] = useState<number | null>(null);",
    "const [editingId, setEditingId] = useState<number | null>(null);\n    const [statusFilter, setStatusFilter] = useState<string>('');\n    const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null);\n    const [paymentData, setPaymentData] = useState({ paymentMethod: 'TRANSFER', paymentReference: '' });"
)

content = content.replace(
    "    factoryName?: string;\n}",
    "    factoryName?: string;\n    status: 'WAITING_APPROVAL' | 'APPROVED' | 'PAID';\n    approvedBy?: string;\n    approvedAt?: string;\n    paidAt?: string;\n    paymentReference?: string;\n    paymentMethod?: string;\n    receiptNumber: string;\n}"
)

# 3. useEffect trigger
content = content.replace(
    "    useEffect(() => {\n        if (!factoryLoading) {\n            fetchData();\n        }\n    }, [selectedFactory, page, factoryLoading]);",
    "    useEffect(() => {\n        if (!factoryLoading) {\n            fetchData();\n        }\n    }, [selectedFactory, page, factoryLoading, statusFilter]);"
)

# 4. fetchData
new_fetch_data = """    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await materialReceiptApi.getAll({
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
                id_factory: selectedFactory || undefined,
                status: statusFilter || undefined
            });

            const receiptsData = response.data?.data || response.data || [];
            const total = response.data?.count || receiptsData.length;

            if (receiptsData && Array.isArray(receiptsData)) {
                const receipts = receiptsData.map((m: any) => ({
                    id: m.id,
                    batchId: m.batch_code,
                    poNumber: '-', 
                    dateReceived: m.receipt_date || m.created_at,
                    supplier: m.Supplier?.name || 'Unknown',
                    supplierId: String(m.id_supplier),
                    materialType: m.ProductType?.name || 'Unknown',
                    categoryId: '', 
                    varietyId: String(m.id_variety) || '',
                    qualityGrade: m.quality_grade || '-',
                    moistureContent: m.moisture_value || 0,
                    density: m.density_value || 0,
                    greenPercentage: 0,
                    netWeight: m.quantity,
                    pricePerKg: m.unit_price,
                    otherCosts: m.other_costs,
                    emptyWeight: 0, 
                    notes: m.notes || '',
                    deliveryNoteUrl: m.delivery_note_url || '',
                    receiptUrl: m.receipt_url || '',
                    factoryName: m.Factory?.name || 'Unknown',
                    createdAt: m.created_at,
                    status: m.status,
                    approvedBy: m.Approver?.fullname,
                    approvedAt: m.approved_at,
                    paidAt: m.paid_at,
                    paymentReference: m.payment_reference,
                    paymentMethod: m.payment_method,
                    receiptNumber: m.receipt_number
                }));
                setBatches(receipts);
                setTotalItems(total);
            }
        } catch (error) {
            logger.error("Error fetching batches:", error);
            showError("Error", "Gagal memuat data penerimaan bahan baku");
        } finally {
            setLoading(false);
        }
    };"""

content = re.sub(r"    const fetchData = async \(\) => \{.+?finally \{\n            setLoading\(false\);\n        \}\n    \};", new_fetch_data, content, flags=re.DOTALL)

# 5. handleSave
# We need to replace the body of handleSave starting from `const factoryId = selectedFactory;`
# up to `setFormData({...})`
save_search_pattern = r"            const factoryId = selectedFactory;.+?setEditingId\(null\);"
save_replacement = """            const payload = {
                id_supplier: parseInt(formData.supplierId),
                id_factory: selectedFactory,
                id_product_type: matchedProductType.id,
                id_variety: formData.varietyId ? parseInt(formData.varietyId) : undefined,
                receipt_date: formData.dateReceived,
                batch_code: formData.batchId,
                quantity: parseFloat(formData.netWeight),
                unit_price: parseFloat(formData.pricePerKg),
                other_costs: parseFloat(formData.otherCosts || '0'),
                delivery_note_url: deliveryNoteUrl || (editingId ? batches.find((b: any) => b.id === editingId)?.deliveryNoteUrl : undefined),
                receipt_url: receiptUrl || (editingId ? batches.find((b: any) => b.id === editingId)?.receiptUrl : undefined),
                notes: formData.notes,
                moisture_value: parseFloat(formData.moistureContent) || undefined,
                density_value: parseFloat(formData.density) || undefined,
                quality_grade: formData.qualityGrade !== '-' ? formData.qualityGrade : undefined,
            };

            let stockRes;
            if (editingId) {
                stockRes = await materialReceiptApi.update(editingId, payload);
                showSuccess("Berhasil", "Penerimaan Bahan Baku berhasil diperbarui!");
            } else {
                stockRes = await materialReceiptApi.create(payload);
                showSuccess("Berhasil", "Penerimaan Bahan Baku berhasil disimpan!");
            }
            
            setEditingId(null);"""

content = re.sub(save_search_pattern, save_replacement, content, flags=re.DOTALL)


# 6. Table Headers
content = content.replace(
    "<th>Total Biaya</th>",
    "<th>Total Biaya</th>\n                                        <th>Status</th>"
)

# 7. Table Rows
# We insert the status span
row_td = """                                            <td><span className="font-mono">{formatCurrency(batch.netWeight * batch.pricePerKg + Number(batch.otherCosts))}</span></td>
                                            <td>
                                                <span className={`badge ${
                                                    batch.status === 'WAITING_APPROVAL' ? 'badge-warning' :
                                                    batch.status === 'APPROVED' ? 'badge-success' :
                                                    'badge-info'
                                                }`}>
                                                    {batch.status === 'WAITING_APPROVAL' ? 'Menunggu Approval' :
                                                     batch.status === 'APPROVED' ? 'Disetujui' : 'Lunas'}
                                                </span>
                                            </td>"""
content = content.replace(
    "                                            <td><span className=\"font-mono\">{formatCurrency(batch.netWeight * batch.pricePerKg + Number(batch.otherCosts))}</span></td>",
    row_td
)

# 8. Action buttons
old_actions = """                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handlePrint(batch)} title="Cetak Slip Internal">
                                                        <span className="material-symbols-outlined icon-sm">print</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(batch)}>
                                                        <span className="material-symbols-outlined icon-sm">edit</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(batch.id)}>
                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                    </button>
                                                </div>"""
new_actions = """                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadPdf(batch)} title="Download PDF Resmi">
                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>picture_as_pdf</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handlePrint(batch)} title="Cetak Label/Slip Internal">
                                                        <span className="material-symbols-outlined icon-sm">print</span>
                                                    </button>
                                                    
                                                    {batch.status === 'WAITING_APPROVAL' && user && ['MANAGER', 'ADMIN', 'SUPERUSER'].includes(user.role) && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleApprove(batch.id)} title="Approve">
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--success)' }}>check_circle</span>
                                                        </button>
                                                    )}
                                                    
                                                    {batch.status === 'APPROVED' && user && ['ACCOUNTING', 'ADMIN', 'SUPERUSER'].includes(user.role) && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowPaymentModal(batch.id)} title="Catat Pembayaran">
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--info)' }}>payments</span>
                                                        </button>
                                                    )}
                                                    
                                                    {batch.status === 'WAITING_APPROVAL' && (
                                                        <>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(batch)}>
                                                                <span className="material-symbols-outlined icon-sm">edit</span>
                                                            </button>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(batch.id)}>
                                                                <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>"""
content = content.replace(old_actions, new_actions)


# 9. Handle new Actions
action_methods = """
    const handleDownloadPdf = async (batch: RawMaterialBatch) => {
        try {
            const response = await materialReceiptApi.downloadPdf(batch.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt_${batch.receiptNumber || batch.batchId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            showError('Error', 'Gagal download PDF');
        }
    };
    
    const handleApprove = async (id: number) => {
        if (!window.confirm('Approve penerimaan bahan baku ini? Stock akan ditambahkan.')) return;
        setLoading(true);
        try {
            await materialReceiptApi.approve(id);
            showSuccess('Berhasil', 'Penerimaan berhasil di-approve');
            fetchData();
        } catch (error: any) {
            showError('Gagal', error.response?.data?.error?.message || 'Gagal approve penerimaan');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSavePayment = async () => {
        if (!showPaymentModal) return;
        setLoading(true);
        try {
            await materialReceiptApi.markAsPaid(showPaymentModal, paymentData);
            showSuccess('Berhasil', 'Pembayaran berhasil dicatat');
            setShowPaymentModal(null);
            fetchData();
        } catch (error: any) {
            showError('Gagal', error.response?.data?.error?.message || 'Gagal menyimpan pembayaran');
        } finally {
            setLoading(false);
        }
    };
    
"""
content = content.replace("    const handlePrint = (batch: RawMaterialBatch) => {", action_methods + "    const handlePrint = (batch: RawMaterialBatch) => {")

# 10. Update handleDelete
old_delete = """    const handleDelete = async (id: number) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus catatan ini?")) {
            setLoading(true);
            try {
                await api.delete(`/stock-movements/${id}`);
                showSuccess("Berhasil", "Data berhasil dihapus!");
                fetchData();
            } catch (error) {
                showError("Gagal", "Gagal menghapus data.");
            } finally {
                setLoading(false);
            }
        }
    };"""
new_delete = """    const handleDelete = async (id: number) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus catatan ini?")) {
            setLoading(true);
            try {
                await materialReceiptApi.delete(id);
                showSuccess("Berhasil", "Data berhasil dihapus!");
                fetchData();
            } catch (error) {
                showError("Gagal", "Gagal menghapus data.");
            } finally {
                setLoading(false);
            }
        }
    };"""
content = content.replace(old_delete, new_delete)

# 11. Payment Modal
payment_modal = """
            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Catat Pembayaran</h3></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Metode Pembayaran</label>
                                <select className="form-control" value={paymentData.paymentMethod} onChange={e => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}>
                                    <option value="TRANSFER">Transfer Bank</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CHECK">Cek/Giro</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Referensi (Opsional)</label>
                                <input type="text" className="form-input" placeholder="No Ref / Bukti..." value={paymentData.paymentReference} onChange={e => setPaymentData({ ...paymentData, paymentReference: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowPaymentModal(null)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSavePayment}>Simpan Pembayaran</button>
                        </div>
                    </div>
                </div>
            )}
"""
content = content.replace("{/* Modals */}", "{/* Modals */}\n" + payment_modal)



with open(file_path, "w") as f:
    f.write(content)

print("Done")
