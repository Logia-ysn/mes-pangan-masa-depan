import axios from 'axios';
import toast from 'react-hot-toast';

// API URL: Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3005');

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor: global error handling + auto-logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
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
            toast.error('Terjadi kesalahan server. Coba lagi nanti.');
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
    getAll: (params?: { limit?: number; offset?: number }) => api.get('/factories', { params }),
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
};

// Stocks
export const stockApi = {
    getAll: (params?: Record<string, any>) => api.get('/stocks', { params }),
    getById: (id: number) => api.get(`/stocks/${id}`),
    create: (data: Record<string, any>) => api.post('/stocks', data),
    update: (id: number, data: Record<string, any>) => api.put(`/stocks/${id}`, data),
    delete: (id: number) => api.delete(`/stocks/${id}`),
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

// Raw Material Varieties
export const rawMaterialVarietyApi = {
    getAll: (params?: Record<string, any>) => api.get('/raw-material-varieties', { params }),
    create: (data: Record<string, any>) => api.post('/raw-material-varieties', data),
};

// Machines
export const machineApi = {
    getAll: (params?: Record<string, any>) => api.get('/machines', { params }),
    getById: (id: number) => api.get(`/machines/${id}`),
    create: (data: Record<string, any>) => api.post('/machines', data),
    update: (id: number, data: Record<string, any>) => api.put(`/machines/${id}`, data),
    delete: (id: number) => api.delete(`/machines/${id}`),
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

// Payments
export const paymentApi = {
    getAll: (params?: Record<string, any>) => api.get('/payments', { params }),
    create: (data: Record<string, any>) => api.post('/payments', data),
    delete: (id: number) => api.delete(`/payments/${id}`),
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

export default api;
