import axios from 'axios';

// API URL: Use environment variable or fallback to localhost
// For Docker: set VITE_API_URL=/api in frontend build
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for global error handling
import toast from 'react-hot-toast';

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || 'Terjadi kesalahan sistem';

        // Prevent toast for 401 (Unauthorized) as it might just redirect
        if (error.response?.status !== 401) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

// Auth
export const authApi = {
    login: (data: { email: string; password: string }) => api.post('/auth/login', data),
    register: (data: { email: string; password: string; fullname: string }) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
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
    create: (data: any) => api.post('/factories', data),
    update: (id: number, data: any) => api.put(`/factories/${id}`, data),
    delete: (id: number) => api.delete(`/factories/${id}`),
};

// Worksheets
export const worksheetApi = {
    getAll: (params?: any) => api.get('/worksheets', { params }),
    getById: (id: number) => api.get(`/worksheets/${id}`),
    create: (data: any) => api.post('/worksheets', data),
    update: (id: number, data: any) => api.put(`/worksheets/${id}`, data),
    delete: (id: number) => api.delete(`/worksheets/${id}`),
};

// Stocks
export const stockApi = {
    getAll: (params?: any) => api.get('/stocks', { params }),
    getById: (id: number) => api.get(`/stocks/${id}`),
    create: (data: any) => api.post('/stocks', data),
    update: (id: number, data: any) => api.put(`/stocks/${id}`, data),
    delete: (id: number) => api.delete(`/stocks/${id}`),
};

// Product Types
export const productTypeApi = {
    getAll: (params?: any) => api.get('/product-types', { params }),
    getById: (id: number) => api.get(`/product-types/${id}`),
    create: (data: any) => api.post('/product-types', data),
};

// Suppliers
export const supplierApi = {
    getAll: (params?: any) => api.get('/suppliers', { params }),
    getById: (id: number) => api.get(`/suppliers/${id}`),
    create: (data: any) => api.post('/suppliers', data),
    update: (id: number, data: any) => api.put(`/suppliers/${id}`, data),
    delete: (id: number) => api.delete(`/suppliers/${id}`),
};

// Raw Material Categories
export const rawMaterialCategoryApi = {
    getAll: (params?: any) => api.get('/raw-material-categories', { params }),
    create: (data: any) => api.post('/raw-material-categories', data),
};

// Raw Material Varieties
export const rawMaterialVarietyApi = {
    getAll: (params?: any) => api.get('/raw-material-varieties', { params }),
    create: (data: any) => api.post('/raw-material-varieties', data),
};

// Machines
export const machineApi = {
    getAll: (params?: any) => api.get('/machines', { params }),
    getById: (id: number) => api.get(`/machines/${id}`),
    create: (data: any) => api.post('/machines', data),
    update: (id: number, data: any) => api.put(`/machines/${id}`, data),
    delete: (id: number) => api.delete(`/machines/${id}`),
};

// Process Categories
export const processCategoryApi = {
    getAll: (params?: { is_main_process?: boolean; is_active?: boolean }) =>
        api.get('/process-categories', { params }),
    create: (data: any) => api.post('/process-categories', data),
};

// Output Products
export const outputProductApi = {
    getAll: (params?: { id_factory?: number; is_active?: boolean }) =>
        api.get('/output-products', { params }),
    create: (data: any) => api.post('/output-products', data),
};

// Stock Movements
export const stockMovementApi = {
    getAll: (params?: any) => api.get('/stock-movements', { params }),
    create: (data: any) => api.post('/stock-movements', data),
    delete: (id: number) => api.delete(`/stock-movements/${id}`),
};

// Quality Parameters
export const qualityParameterApi = {
    getAll: (params?: { id_variety?: number }) => api.get('/quality-parameters', { params }),
    create: (data: any) => api.post('/quality-parameters', data),
    update: (id: number, data: any) => api.put(`/quality-parameters/${id}`, data),
    delete: (id: number) => api.delete(`/quality-parameters/${id}`),
};

// Quality Analysis
export const qualityAnalysisApi = {
    submit: (data: any) => api.post('/quality-analysis', data),
};

// QC Gabah (ML)
export const qcGabahApi = {
    analyze: (data: { image_base64: string; supplier?: string; lot?: string }) =>
        api.post('/analyze-grain', data),
};

// Employees (kept for operator selection in worksheets)
export const employeeApi = {
    getAll: (params?: any) => api.get('/employees', { params }),
    getById: (id: number) => api.get(`/employees/${id}`),
    create: (data: any) => api.post('/employees', data),
    update: (id: number, data: any) => api.put(`/employees/${id}`, data),
    delete: (id: number) => api.delete(`/employees/${id}`),
};

export default api;
