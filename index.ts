import 'reflect-metadata';
import { prisma } from './src/libs/prisma';
import { Server } from '@naiv/codegen-nodejs-typeorm';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import express from 'express';
import { getUserFromToken } from './utility/auth';
import { pdfService } from './src/services/pdf.service';
import { createWorkbook } from './src/services/excel.service';
import { worksheetRepository } from './src/repositories/worksheet.repository';
import { BackupService } from './src/services/backup.service';
import fileUpload from 'express-fileupload';
import {
  t_submitWorksheet,
  t_approveWorksheet,
  t_rejectWorksheet,
  t_cancelWorksheet
} from './implementation/T_worksheetWorkflow';
import { t_getWorksheetPdf } from './implementation/T_getWorksheetPdf';
import { t_getQCResults } from './implementation/T_getQCResults';
import { t_updateQCResult } from './implementation/T_updateQCResult';
import { t_deleteQCResult } from './implementation/T_deleteQCResult';
import { t_getDryingLogs } from './implementation/T_getDryingLogs';
import { t_updateDryingLog } from './implementation/T_updateDryingLog';
import { t_deleteDryingLog } from './implementation/T_deleteDryingLog';
import { handler as t_getPOReceivableItems } from './implementation/T_getPOReceivableItems';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = FRONTEND_URL.split(',').map(o => o.trim());

// --- BigInt Serialization Patch ---
// Prevent "Do not know how to serialize a BigInt" error in JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const server = new Server({ noCors: true });

// Trust proxy for secure cookies in production (Railway/Vercel)
server.express.set('trust proxy', 1);

// --- CORS with credentials ---
server.express.use(cors({
  origin: (origin, callback) => {
    // Allow local development
    if (!origin || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Check if origin matches allowed origins or is a Vercel preview
    const isAllowed = allowedOrigins.includes(origin);
    const isVercelPreview = origin.endsWith('.vercel.app');

    if (isAllowed || isVercelPreview) {
      callback(null, true);
    } else {
      console.warn('CORS Blocked for origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// --- Cookie parser ---
server.express.use(cookieParser());

// --- File upload (Surat Jalan/Tanda Terima) ---
server.express.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// --- Static files serving ---
server.express.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Cookie to Authorization Header Middleware ---
// NAIV handlers only receive filtered request objects (headers, body, query, path).
// We map the httpOnly cookie back to the Authorization header so NAIV handlers can see it.
server.express.use((req, res, next) => {
  if (!req.headers.authorization && req.cookies?.token) {
    req.headers.authorization = `Bearer ${req.cookies.token}`;
  }
  next();
});

// --- Request logging ---
server.express.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    }));
  });
  next();
});

// --- Rate limiting ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 100
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Reduced from 50 to prevent brute-force
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts. Please wait 15 minutes.' } },
});

server.express.use(globalLimiter);
server.express.use('/auth/login', authLimiter);
server.express.use('/auth/register', authLimiter);

// --- Health check ---
server.express.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// --- Audit Logs API ---
const auditLogsHandler = async (req: any, res: any) => {
  console.log(`[DEBUG] Audit logs hit: ${req.method} ${req.originalUrl}`);
  try {
    const user = await getUserFromToken(req);
    // Only ADMIN or SUPERUSER can see audit logs
    const { User_role_enum } = require('@prisma/client');
    if (user.role !== User_role_enum.ADMIN && user.role !== User_role_enum.SUPERUSER) {
      return res.status(403).json({ success: false, error: { message: 'Insufficient permissions' } });
    }

    const { auditService } = require('./src/services/audit.service');
    const { userId, tableName, action, limit, offset } = req.query;

    const logs = await auditService.getLogs({
      userId: userId ? Number(userId) : undefined,
      tableName: tableName as string,
      action: action as string,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error(`[DEBUG] Audit logs error: ${error.message} (Status: ${statusCode})`);
    res.status(statusCode).json({ success: false, error: { message: error.message || 'Failed to fetch audit logs' } });
  }
};

server.express.get('/audit-logs', auditLogsHandler);
server.express.get('/api/audit-logs', auditLogsHandler);


// --- Batch Code Generation API ---
server.express.post('/batch-code/generate', express.json(), async (req, res) => {
  try {
    const { factoryCode, productTypeId, date } = req.body;
    if (!factoryCode || !productTypeId) {
      return res.status(400).json({ error: 'factoryCode and productTypeId are required' });
    }
    const { BatchNumberingService } = require('./src/services/batch-numbering.service');
    const batchDate = date ? new Date(date) : new Date();
    const batchCode = await BatchNumberingService.generateBatchForProduct(
      factoryCode, Number(productTypeId), batchDate
    );
    res.json({ batchCode });
  } catch (error: any) {
    console.error('Batch code generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate batch code' });
  }
});

// --- Invoice PDF export ---
server.express.get('/invoices/:id/pdf', async (req, res) => {
  try {
    await getUserFromToken(req);

    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid invoice ID' } });
    }

    // Get invoice number for filename
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { invoice_number: true } });
    const filename = `${invoice?.invoice_number || `invoice-${invoiceId}`}.pdf`;

    const buffer = await pdfService.generateInvoicePDF(invoiceId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, error: { message: error.message || 'Failed to generate PDF' } });
  }
});

// --- Excel Export: Production Summary ---
server.express.get('/reports/production-summary/excel', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    const { id_factory, start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, error: { message: 'start_date and end_date are required' } });
    }

    const worksheets = await worksheetRepository.findByDateRange(
      new Date(start_date as string),
      new Date(end_date as string),
      id_factory ? Number(id_factory) : undefined
    );

    const data = worksheets.map((w: any) => ({
      tanggal: new Date(w.worksheet_date).toLocaleDateString('id-ID'),
      shift: w.shift,
      pabrik: w.Factory?.name || '-',
      gabah_input: Number(w.gabah_input),
      beras_output: Number(w.beras_output),
      menir: Number(w.menir_output),
      dedak: Number(w.dedak_output),
      sekam: Number(w.sekam_output),
      rendemen: w.rendemen ? Number(w.rendemen) : 0,
      jam_mesin: Number(w.machine_hours),
      downtime: Number(w.downtime_hours),
    }));

    const buffer = await createWorkbook('Laporan Produksi', [
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'Shift', key: 'shift', width: 10 },
      { header: 'Pabrik', key: 'pabrik', width: 20 },
      { header: 'Gabah Input (kg)', key: 'gabah_input', width: 18 },
      { header: 'Beras Output (kg)', key: 'beras_output', width: 18 },
      { header: 'Menir (kg)', key: 'menir', width: 14 },
      { header: 'Dedak (kg)', key: 'dedak', width: 14 },
      { header: 'Sekam (kg)', key: 'sekam', width: 14 },
      { header: 'Rendemen (%)', key: 'rendemen', width: 14 },
      { header: 'Jam Mesin', key: 'jam_mesin', width: 12 },
      { header: 'Downtime (jam)', key: 'downtime', width: 14 },
    ], data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-produksi-${start_date}-${end_date}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { message: error.message || 'Failed to generate Excel' } });
  }
});

// --- Excel Export: Sales Summary ---
server.express.get('/reports/sales-summary/excel', async (req, res) => {
  try {
    await getUserFromToken(req);
    const { id_factory, start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, error: { message: 'start_date and end_date are required' } });
    }

    const where: any = {
      invoice_date: { gte: new Date(start_date as string), lte: new Date(end_date as string) },
    };
    if (id_factory) where.id_factory = Number(id_factory);

    const { prisma: db } = require('./src/libs/prisma');
    const invoices = await db.invoice.findMany({
      where,
      include: { Customer: true, Payment: true },
      orderBy: { invoice_date: 'desc' },
    });

    const data = invoices.map((inv: any) => ({
      no_invoice: inv.invoice_number,
      tanggal: new Date(inv.invoice_date).toLocaleDateString('id-ID'),
      pelanggan: inv.Customer?.name || '-',
      subtotal: Number(inv.subtotal),
      pajak: Number(inv.tax),
      diskon: Number(inv.discount),
      total: Number(inv.total),
      dibayar: inv.Payment.reduce((s: number, p: any) => s + Number(p.amount), 0),
      status: inv.status,
    }));

    const buffer = await createWorkbook('Laporan Penjualan', [
      { header: 'No. Invoice', key: 'no_invoice', width: 18 },
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'Pelanggan', key: 'pelanggan', width: 24 },
      { header: 'Subtotal', key: 'subtotal', width: 16 },
      { header: 'Pajak', key: 'pajak', width: 14 },
      { header: 'Diskon', key: 'diskon', width: 14 },
      { header: 'Total', key: 'total', width: 16 },
      { header: 'Dibayar', key: 'dibayar', width: 16 },
      { header: 'Status', key: 'status', width: 12 },
    ], data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-penjualan-${start_date}-${end_date}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { message: error.message || 'Failed to generate Excel' } });
  }
});

// --- Excel Export: Stock Report ---
server.express.get('/reports/stock-report/excel', async (req, res) => {
  try {
    await getUserFromToken(req);
    const { id_factory, start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, error: { message: 'start_date and end_date are required' } });
    }

    const { prisma: db } = require('./src/libs/prisma');
    const where: any = {
      created_at: { gte: new Date(start_date as string), lte: new Date(end_date as string) },
    };
    if (id_factory) where.Stock = { id_factory: Number(id_factory) };

    const movements = await db.stockMovement.findMany({
      where,
      include: { Stock: { include: { ProductType: true } }, User: true },
      orderBy: { created_at: 'desc' },
    });

    const data = movements.map((m: any) => ({
      tanggal: new Date(m.created_at).toLocaleDateString('id-ID'),
      produk: m.Stock?.ProductType?.name || '-',
      tipe: m.movement_type,
      jumlah: Number(m.quantity),
      referensi: m.reference_type || '-',
      user: m.User?.fullname || '-',
      catatan: m.notes || '-',
    }));

    const buffer = await createWorkbook('Laporan Stok', [
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'Produk', key: 'produk', width: 22 },
      { header: 'Tipe', key: 'tipe', width: 12 },
      { header: 'Jumlah (kg)', key: 'jumlah', width: 14 },
      { header: 'Referensi', key: 'referensi', width: 16 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Catatan', key: 'catatan', width: 24 },
    ], data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-stok-${start_date}-${end_date}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: { message: error.message || 'Failed to generate Excel' } });
  }
});

// --- Quality Trends API ---
const qualityTrendsHandler = async (req: any, res: any) => {
  console.log(`[DEBUG] Quality trends hit: ${req.method} ${req.originalUrl}`);
  try {
    await getUserFromToken(req);
    const { start_date, end_date, id_factory } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, error: { message: 'start_date and end_date are required' } });
    }

    const { prisma: db } = require('./src/libs/prisma');

    // Quality trends from Raw Material Analysis
    const analyses = await db.rawMaterialQualityAnalysis.findMany({
      where: {
        analysis_date: {
          gte: new Date(start_date as string),
          lte: new Date(end_date as string),
        },
        StockMovement: id_factory ? {
          Stock: { id_factory: Number(id_factory) }
        } : undefined
      },
      orderBy: { analysis_date: 'asc' },
      select: {
        analysis_date: true,
        moisture_value: true,
        density_value: true,
        green_percentage: true,
        yellow_percentage: true,
        red_percentage: true,
        final_grade: true,
        batch_id: true
      }
    });

    res.json({ success: true, data: analyses });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    console.error(`[DEBUG] Quality trends error: ${error.message} (Status: ${statusCode})`);
    res.status(statusCode).json({ success: false, error: { message: error.message || 'Failed to fetch quality trends' } });
  }
};

server.express.get('/reports/quality-trends', qualityTrendsHandler);
server.express.get('/api/reports/quality-trends', qualityTrendsHandler);

// --- File Upload API ---
server.express.post('/upload', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded.' });
    }

    const { type } = req.query; // e.g. 'surat-jalan' or 'tanda-terima'
    const folder = type === 'tanda-terima' ? 'tanda-terima' : 'surat-jalan';

    // Create folders if they don't exist
    const fs = require('fs');
    const uploadDir = path.join(__dirname, 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const file = req.files.file as any;
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const uploadPath = path.join(uploadDir, fileName);

    await file.mv(uploadPath);

    res.json({
      success: true,
      url: `/uploads/${folder}/${fileName}`,
      fileName: fileName
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Worksheet Workflow Routes ---
server.express.post('/worksheets/:id/submit', express.json(), (req, res) => t_submitWorksheet(req as any, res as any));
server.express.post('/worksheets/:id/approve', express.json(), (req, res) => t_approveWorksheet(req as any, res as any));
server.express.post('/worksheets/:id/reject', express.json(), (req, res) => t_rejectWorksheet(req as any, res as any));
server.express.post('/worksheets/:id/cancel', express.json(), (req, res) => t_cancelWorksheet(req as any, res as any));

// --- Production Audit Fixes (Manual Mount to avoid 404) ---
server.express.get('/worksheets/:id/pdf', (req, res) => t_getWorksheetPdf(req as any, res as any));
server.express.get('/qc-results', (req, res) => t_getQCResults(req as any, res as any));
server.express.put('/qc-results', express.json(), (req, res) => t_updateQCResult(req as any, res as any));
server.express.delete('/qc-results', (req, res) => t_deleteQCResult(req as any, res as any));
server.express.get('/drying-logs', (req, res) => t_getDryingLogs(req as any, res as any));
server.express.put('/drying-logs/:id', express.json(), (req, res) => t_updateDryingLog(req as any, res as any));
server.express.delete('/drying-logs/:id', (req, res) => t_deleteDryingLog(req as any, res as any));

// PO Receivable Items
server.express.get('/purchase-orders/:id/receivable-items', (req, res) => t_getPOReceivableItems(req as any, res as any));

// --- Backup & Restore API (Admin Only) ---

const ADMIN_ROLES = ['ADMIN', 'SUPERUSER'];

server.express.post('/admin/backup', express.json(), async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Admin access required' } });
    }
    console.log(`[BACKUP] Creating backup requested by ${user.fullname}`);
    const backup = await BackupService.createBackup();
    console.log(`[BACKUP] Created: ${backup.fileName} (${backup.sizeFormatted})`);
    res.json({ success: true, data: backup });
  } catch (error: any) {
    console.error('[BACKUP] Create failed:', error.message);
    res.status(500).json({ success: false, error: { message: error.message || 'Failed to create backup' } });
  }
});

server.express.get('/admin/backups', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Admin access required' } });
    }
    const backups = BackupService.listBackups();
    res.json({ success: true, data: backups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message || 'Failed to list backups' } });
  }
});

server.express.get('/admin/backups/:fileName/download', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Admin access required' } });
    }
    const filePath = BackupService.getBackupPath(req.params.fileName);
    res.download(filePath, req.params.fileName);
  } catch (error: any) {
    res.status(404).json({ success: false, error: { message: error.message || 'Backup not found' } });
  }
});

server.express.delete('/admin/backups/:fileName', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Admin access required' } });
    }
    BackupService.deleteBackup(req.params.fileName);
    console.log(`[BACKUP] Deleted: ${req.params.fileName} by ${user.fullname}`);
    res.json({ success: true, message: 'Backup deleted' });
  } catch (error: any) {
    res.status(404).json({ success: false, error: { message: error.message || 'Failed to delete backup' } });
  }
});

server.express.post('/admin/restore', async (req: any, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Admin access required' } });
    }

    let restoreResult: { success: boolean; message: string };

    // Accept either uploaded file or fileName reference
    if (req.files && req.files.backup) {
      // Uploaded file
      const file = req.files.backup as any;
      const tempPath = `/tmp/restore_${Date.now()}.dump`;
      await file.mv(tempPath);
      console.log(`[RESTORE] Restoring from uploaded file by ${user.fullname}`);
      restoreResult = await BackupService.restoreBackup(tempPath);
      // Cleanup temp file
      const fs = require('fs');
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } else if (req.body && req.body.fileName) {
      // Restore from existing backup on server
      const filePath = BackupService.getBackupPath(req.body.fileName);
      console.log(`[RESTORE] Restoring from ${req.body.fileName} by ${user.fullname}`);
      restoreResult = await BackupService.restoreBackup(filePath);
    } else {
      return res.status(400).json({ success: false, error: { message: 'Provide a backup file or fileName' } });
    }

    res.json({ success: restoreResult.success, message: restoreResult.message });
  } catch (error: any) {
    console.error('[RESTORE] Failed:', error.message);
    res.status(500).json({ success: false, error: { message: error.message || 'Failed to restore backup' } });
  }
});

// --- Logout (clears httpOnly cookie) ---
server.express.post('/auth/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true });
});

// --- Start server ---
const port = Number(process.env.PORT || 3005);
console.log(`Starting server on port ${port}...`);

server.run({
  port: port,
  types_path: path.resolve(__dirname, 'types'),
  implementation_path: path.resolve(__dirname, 'implementation'),
  async beforeStart() {
    await prisma.$connect();
    console.log('Prisma connected');

    // Auto-seed batch code mappings if empty
    const { BatchNumberingService } = require('./src/services/batch-numbering.service');
    const seeded = await BatchNumberingService.seedDefaultMappings();
    if (seeded > 0) console.log(`Seeded ${seeded} batch code mappings`);
  }
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  prisma.$disconnect().finally(() => process.exit(1));
});
