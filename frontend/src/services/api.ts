import axios from 'axios';
import toast from 'react-hot-toast';

// API URL: Use environment variable or fallback to Railway production URL, then localhost
const PROD_API_URL = 'https://erp-pangan-masa-depan-production-7abe.up.railway.app'; // Fixed production URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : 'http://localhost:3005');

console.log('Production mode:', import.meta.env.PROD);
console.log('Using API Base URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Request deduplication for GET requests ---
// Prevents duplicate concurrent requests (e.g. multiple /auth/me on page load)
const pendingRequests = new Map<string, Promise<any>>();

api.interceptors.request.use((config) => {
    if (config.method === 'get') {
        const key = `${config.url}${JSON.stringify(config.params || {})}`;
        const pending = pendingRequests.get(key);
        if (pending) {
            // Cancel this request — the first one will handle it
            const controller = new AbortController();
            config.signal = controller.signal;
            // Return the pending promise's result via adapter
            pending.then(() => controller.abort()).catch(() => controller.abort());
        }
    }
    return config;
});

// Response interceptor: global error handling + auto-logout on 401
api.interceptors.response.use(
    (response) => {
        // Clear dedup cache on success
        if (response.config.method === 'get') {
            const key = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
            pendingRequests.delete(key);
        }
        return response;
    },
    (error) => {
        // Clear dedup cache on error
        if (error.config?.method === 'get') {
            const key = `${error.config.url}${JSON.stringify(error.config.params || {})}`;
            pendingRequests.delete(key);
        }

        // Ignore cancelled/aborted requests (deduplication)
        if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
            return Promise.reject(error);
        }

        const status = error.response?.status;
        const message = error.response?.data?.error?.message
            || error.response?.data?.message
            || error.message
            || 'Terjadi kesalahan sistem';

        if (status === 401) {
            // Auto-logout: redirect to login (cookie cleared server-side)
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (status === 403) {
            toast.error('Akses ditolak. Anda tidak memiliki izin.');
        } else if (status === 422) {
            toast.error(message);
        } else if (status && status >= 500) {
            // Show actual error message if available, otherwise generic
            toast.error(message !== 'An unexpected error occurred' ? message : 'Terjadi kesalahan server. Coba lagi nanti.');
        } else if (status && status >= 400) {
            toast.error(message);
        } else if (error.code === 'ECONNABORTED') {
            toast.error('Request timeout. Periksa koneksi internet Anda.');
        } else if (!error.response) {
            toast.error('Tidak dapat terhubung ke server.');
        }

        return Promise.reject(error);
    }
);

// Auth
export const authApi = {
    login: (data: { email: string; password: string }) => api.post('/auth/login', data),
    register: (data: { email: string; password: string; fullname: string }) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};

// Dashboard
export const dashboardApi = {
    getStats: (params?: { id_factory?: number; start_date?: string; end_date?: string }) =>
        api.get('/dashboard/stats', { params }),
    getExecutive: (params?: { id_factory?: number }) =>
        api.get('/dashboard/executive', { params }),
};

// Factory
export const factoryApi = {
    getAll: (params?: { limit?: number; offset?: number; is_active?: string }) =>
        api.get('/factories', { params: { is_active: 'true', ...params } }),
    getById: (id: number) => api.get(`/factories/${id}`),
    create: (data: Record<string, any>) => api.post('/factories', data),
    update: (id: number, data: Record<string, any>) => api.put(`/factories/${id}`, data),
    delete: (id: number) => api.delete(`/factories/${id}`),
};

// Worksheets
export const worksheetApi = {
    getAll: (params?: Record<string, any>) => api.get('/worksheets', { params }),
    getById: (id: number) => api.get(`/worksheets/${id}`),
    create: (data: Record<string, any>) => api.post('/worksheets', data),
    update: (id: number, data: Record<string, any>) => api.put(`/worksheets/${id}`, data),
    delete: (id: number) => api.delete(`/worksheets/${id}`),
    // Workflow
    submit: (id: number) => api.post(`/worksheets/${id}/submit`),
    approve: (id: number) => api.post(`/worksheets/${id}/approve`),
    reject: (id: number, reason: string) => api.post(`/worksheets/${id}/reject`, { reason }),
    cancel: (id: number, reason?: string) => api.post(`/worksheets/${id}/cancel`, { reason }),
    downloadPdf: (id: number) => api.get(`/worksheets/${id}/pdf`, { responseType: 'blob' }),
};

// Stocks
export const stockApi = {
    getAll: (params?: Record<string, any>) => api.get('/stocks', { params }),
    getById: (id: number) => api.get(`/stocks/${id}`),
    create: (data: Record<string, any>) => api.post('/stocks', data),
    update: (id: number, data: Record<string, any>) => api.put(`/stocks/${id}`, data),
    delete: (id: number) => api.delete(`/stocks/${id}`),
    // NEW: Transfer stock between factories
    transfer: (data: { fromFactoryId: number; toFactoryId: number; productCode: string; quantity: number; notes?: string }) =>
        api.post('/stocks/transfer', data),
};

// Material Receipts
export const materialReceiptApi = {
    getAll: (params?: Record<string, any>) => api.get('/material-receipts', { params }),
    getById: (id: number) => api.get(`/material-receipts/${id}`),
    create: (data: Record<string, any>) => api.post('/material-receipts', data),
    update: (id: number, data: Record<string, any>) => api.put(`/material-receipts/${id}`, data),
    delete: (id: number) => api.delete(`/material-receipts/${id}`),
    approve: (id: number) => api.post(`/material-receipts/${id}/approve`),
    markAsPaid: (id: number, data: Record<string, any>) => api.post(`/material-receipts/${id}/pay`, data),
    downloadPdf: (id: number) => api.get(`/material-receipts/${id}/pdf`, { responseType: 'blob' }),
};

// Product Types
export const productTypeApi = {
    getAll: (params?: Record<string, any>) => api.get('/product-types', { params }),
    getById: (id: number) => api.get(`/product-types/${id}`),
    create: (data: Record<string, any>) => api.post('/product-types', data),
};

// Suppliers
export const supplierApi = {
    getAll: (params?: Record<string, any>) => api.get('/suppliers', { params }),
    getById: (id: number) => api.get(`/suppliers/${id}`),
    create: (data: Record<string, any>) => api.post('/suppliers', data),
    update: (id: number, data: Record<string, any>) => api.put(`/suppliers/${id}`, data),
    delete: (id: number) => api.delete(`/suppliers/${id}`),
};

// Raw Material Categories
export const rawMaterialCategoryApi = {
    getAll: (params?: Record<string, any>) => api.get('/raw-material-categories', { params }),
    create: (data: Record<string, any>) => api.post('/raw-material-categories', data),
};

// Rice Varieties (New System)
export const riceVarietyApi = {
    getAll: (params?: Record<string, any>) => api.get('/rice-varieties', { params }),
    create: (data: Record<string, any>) => api.post('/rice-varieties', data),
    update: (id: number, data: Record<string, any>) => api.put(`/rice-varieties/${id}`, data),
    delete: (id: number) => api.delete(`/rice-varieties/${id}`),
};

// Rice Levels
export const riceLevelApi = {
    getAll: (params?: Record<string, any>) => api.get('/rice-levels', { params }),
    create: (data: Record<string, any>) => api.post('/rice-levels', data),
    update: (id: number, data: Record<string, any>) => api.put(`/rice-levels/${id}`, data),
    delete: (id: number) => api.delete(`/rice-levels/${id}`),
};

// Rice Brands
export const riceBrandApi = {
    getAll: (params?: Record<string, any>) => api.get('/rice-brands', { params }),
    create: (data: Record<string, any>) => api.post('/rice-brands', data),
    update: (id: number, data: Record<string, any>) => api.put(`/rice-brands/${id}`, data),
    delete: (id: number) => api.delete(`/rice-brands/${id}`),
};

// Factory Materials
export const factoryMaterialApi = {
    getAll: (id_factory: number) => api.get('/factory-materials', { params: { id_factory } }),
    upsert: (data: { id_factory: number; id_product_type: number; is_input: boolean; is_output: boolean }) =>
        api.post('/factory-materials', data),
};

// Machines
export const machineApi = {
    getAll: (params?: Record<string, any>) => api.get('/machines', { params }),
    getById: (id: number) => api.get(`/machines/${id}`),
    create: (data: Record<string, any>) => api.post('/machines', data),
    update: (id: number, data: Record<string, any>) => api.put(`/machines/${id}`, data),
    delete: (id: number) => api.delete(`/machines/${id}`),
};

// Production Lines
export const productionLineApi = {
    getAll: (params?: Record<string, any>) => api.get('/production-lines', { params }),
    getById: (id: number) => api.get(`/production-lines/${id}`),
    create: (data: Record<string, any>) => api.post('/production-lines', data),
    update: (id: number, data: Record<string, any>) => api.put(`/production-lines/${id}`, data),
    delete: (id: number) => api.delete(`/production-lines/${id}`),
    assignMachine: (lineId: number, data: { id_machine: number; sequence_order: number }) =>
        api.post(`/production-lines/${lineId}/machines`, data),
    removeMachine: (lineId: number, machineId: number) =>
        api.delete(`/production-lines/${lineId}/machines/${machineId}`),
};

// Work Orders
export const workOrderApi = {
    getAll: (params?: Record<string, any>) => api.get('/work-orders', { params }),
    getById: (id: number) => api.get(`/work-orders/${id}`),
    create: (data: Record<string, any>) => api.post('/work-orders', data),
    update: (id: number, data: Record<string, any>) => api.put(`/work-orders/${id}`, data),
    delete: (id: number) => api.delete(`/work-orders/${id}`),
    workflow: (id: number, data: { action: string; actual_quantity?: number; reason?: string }) =>
        api.post(`/work-orders/${id}/workflow`, data),
    addWorksheet: (id: number, data: { id_worksheet: number; step_number: number }) =>
        api.post(`/work-orders/${id}/worksheets`, data),
    removeWorksheet: (id: number, worksheetId: number) =>
        api.delete(`/work-orders/${id}/worksheets/${worksheetId}`),
};

// Process Categories
export const processCategoryApi = {
    getAll: (params?: { is_main_process?: boolean; is_active?: boolean }) =>
        api.get('/process-categories', { params }),
    create: (data: Record<string, any>) => api.post('/process-categories', data),
};

// Output Products
export const outputProductApi = {
    getAll: (params?: { id_factory?: number; is_active?: boolean }) =>
        api.get('/output-products', { params }),
    create: (data: Record<string, any>) => api.post('/output-products', data),
};

// Stock Movements
export const stockMovementApi = {
    getAll: (params?: Record<string, any>) => api.get('/stock-movements', { params }),
    create: (data: Record<string, any>) => api.post('/stock-movements', data),
    delete: (id: number) => api.delete(`/stock-movements/${id}`),
};

// Quality Parameters
export const qualityParameterApi = {
    getAll: (params?: { id_variety?: number }) => api.get('/quality-parameters', { params }),
    create: (data: Record<string, any>) => api.post('/quality-parameters', data),
    update: (id: number, data: Record<string, any>) => api.put(`/quality-parameters/${id}`, data),
    delete: (id: number) => api.delete(`/quality-parameters/${id}`),
    resetAll: () => api.post('/quality-parameters/reset'),
};

// Quality Analysis
export const qualityAnalysisApi = {
    submit: (data: Record<string, any>) => api.post('/quality-analysis', data),
};

// QC Gabah (ML)
export const qcGabahApi = {
    analyze: (data: { image_base64: string; supplier?: string; lot?: string }) =>
        api.post('/analyze-grain', data),
};

// QC Result (Produk Jadi)
export const qcResultApi = {
    getAll: (params?: Record<string, any>) => api.get('/qc-results', { params }),
    getById: (id: number) => api.get(`/qc-results/${id}`),
    create: (data: Record<string, any>) => api.post('/qc-results', data),
    update: (id: number, data: Record<string, any>) => api.put(`/qc-results/${id}`, data),
    delete: (id: number) => api.delete(`/qc-results/${id}`),
};

// Drying Log (Pengeringan)
export const dryingLogApi = {
    getAll: (params?: Record<string, any>) => api.get('/drying-logs', { params }),
    getById: (id: number) => api.get(`/drying-logs/${id}`),
    create: (data: Record<string, any>) => api.post('/drying-logs', data),
    update: (id: number, data: Record<string, any>) => api.put(`/drying-logs/${id}`, data),
    delete: (id: number) => api.delete(`/drying-logs/${id}`),
};

// Customers
export const customerApi = {
    getAll: (params?: Record<string, any>) => api.get('/customers', { params }),
    getById: (id: number) => api.get(`/customers/${id}`),
    create: (data: Record<string, any>) => api.post('/customers', data),
    update: (id: number, data: Record<string, any>) => api.put(`/customers/${id}`, data),
    delete: (id: number) => api.delete(`/customers/${id}`),
};

// Invoices
export const invoiceApi = {
    getAll: (params?: Record<string, any>) => api.get('/invoices', { params }),
    getById: (id: number) => api.get(`/invoices/${id}`),
    create: (data: Record<string, any>) => api.post('/invoices', data),
    update: (id: number, data: Record<string, any>) => api.put(`/invoices/${id}`, data),
    delete: (id: number) => api.delete(`/invoices/${id}`),
    addItem: (invoiceId: number, data: Record<string, any>) => api.post(`/invoices/${invoiceId}/items`, data),
    deleteItem: (itemId: number) => api.delete(`/invoice-items/${itemId}`),
    downloadPDF: (id: number) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// Delivery Orders (Surat Jalan)
export const deliveryOrderApi = {
    getAll: (params?: Record<string, any>) => api.get('/delivery-orders', { params }),
    getById: (id: number) => api.get(`/delivery-orders/${id}`),
    create: (data: Record<string, any>) => api.post('/delivery-orders', data),
};

// Payments
export const paymentApi = {
    getAll: (params?: Record<string, any>) => api.get('/payments', { params }),
    create: (data: Record<string, any>) => api.post('/payments', data),
    delete: (id: number) => api.delete(`/payments/${id}`),
};

// Attendance
export const attendanceApi = {
    getAll: (params?: Record<string, any>) => api.get('/attendances', { params }),
    create: (data: Record<string, any>) => api.post('/attendances', data),
};

// Stock Opname
export const stockOpnameApi = {
    getAll: (params?: Record<string, any>) => api.get('/stock-opnames', { params }),
    create: (data: Record<string, any>) => api.post('/stock-opnames', data),
};

// Employees
export const employeeApi = {
    getAll: (params?: Record<string, any>) => api.get('/employees', { params }),
    getById: (id: number) => api.get(`/employees/${id}`),
    create: (data: Record<string, any>) => api.post('/employees', data),
    update: (id: number, data: Record<string, any>) => api.put(`/employees/${id}`, data),
    delete: (id: number) => api.delete(`/employees/${id}`),
};

// Purchase Orders
export const purchaseOrderApi = {
    getAll: (params?: Record<string, any>) => api.get('/purchase-orders', { params }),
    getById: (id: number) => api.get(`/purchase-orders/${id}`),
    create: (data: Record<string, any>) => api.post('/purchase-orders', data),
    update: (id: number, data: Record<string, any>) => api.put(`/purchase-orders/${id}`, data),
    delete: (id: number) => api.delete(`/purchase-orders/${id}`),
    approve: (id: number) => api.post(`/purchase-orders/${id}/approve`),
    cancel: (id: number) => api.post(`/purchase-orders/${id}/cancel`),
    getStats: (params?: Record<string, any>) => api.get('/purchase-orders/stats', { params }),
    getReceivableItems: (id: number) => api.get(`/purchase-orders/${id}/receivable-items`),
};

// Goods Receipts
export const goodsReceiptApi = {
    getAll: (params?: Record<string, any>) => api.get('/goods-receipts', { params }),
    getById: (id: number) => api.get(`/goods-receipts/${id}`),
    create: (data: Record<string, any>) => api.post('/goods-receipts', data),
    delete: (id: number) => api.delete(`/goods-receipts/${id}`),
};

// Reports
export const reportApi = {
    getProductionSummary: (params: { id_factory?: number; start_date: string; end_date: string }) =>
        api.get('/reports/production-summary', { params }),
    getSalesSummary: (params: { id_factory?: number; start_date: string; end_date: string }) =>
        api.get('/reports/sales-summary', { params }),
    getCOGMReport: (params: { id_factory?: number; start_date: string; end_date: string }) =>
        api.get('/reports/cogm', { params }),
    getStockReport: (params: { id_factory?: number; start_date: string; end_date: string }) =>
        api.get('/reports/stock-report', { params }),
    downloadProductionExcel: (params: { id_factory?: number; start_date: string; end_date: string }) =>
        api.get('/reports/production-summary/excel', { params, responseType: 'blob' }),
    downloadSalesExcel: (params: { id_factory?: number; start_date: string; end_date: string }) =>
        api.get('/reports/sales-summary/excel', { params, responseType: 'blob' }),
    downloadStockExcel: (params: { id_factory?: number; start_date: string; end_date: string }) =>
        api.get('/reports/stock-report/excel', { params, responseType: 'blob' }),
    getQualityTrends: (params: { id_factory?: number; start_date: string; end_date: string }) =>
        api.get('/reports/quality-trends', { params }),
};

// Notifications
export const notificationApi = {
    getAll: (params?: { limit?: number; offset?: number }) => api.get('/notifications', { params }),
    getCount: () => api.get('/notifications/count'),
    markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
    markAllAsRead: () => api.post('/notifications/read-all'),
    check: () => api.post('/notifications/check'),
};

// User Management (Admin)
export const userApi = {
    getAll: (params?: { limit?: number; offset?: number; search?: string; role?: string }) =>
        api.get('/users', { params }),
    getById: (id: number) =>
        api.get(`/users/${id}`),
    create: (data: { email: string; password: string; fullname: string; role?: string; id_factory?: number }) =>
        api.post('/users', data),
    update: (id: number, data: { email?: string; fullname?: string; role?: string; is_active?: boolean; id_factory?: number }) =>
        api.put(`/users/${id}`, data),
    delete: (id: number) =>
        api.delete(`/users/${id}`),
    resetPassword: (id: number, data: { new_password: string }) =>
        api.put(`/users/${id}/reset-password`, data),
};

// Audit Logs
export const auditApi = {
    getAll: (params?: { userId?: number; tableName?: string; action?: string; limit?: number; offset?: number }) =>
        api.get('/audit-logs', { params }),
};

// Downtime Events
export const downtimeEventApi = {
    getAll: (params?: Record<string, any>) => api.get('/downtime-events', { params }),
    getById: (id: number) => api.get(`/downtime-events/${id}`),
    create: (data: Record<string, any>) => api.post('/downtime-events', data),
    update: (id: number, data: Record<string, any>) => api.put(`/downtime-events/${id}`, data),
    resolve: (id: number, data: Record<string, any>) => api.put(`/downtime-events/${id}/resolve`, data),
    delete: (id: number) => api.delete(`/downtime-events/${id}`),
};

export default api;
