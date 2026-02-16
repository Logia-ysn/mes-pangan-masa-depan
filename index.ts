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
import fileUpload from 'express-fileupload';

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

    const buffer = await pdfService.generateInvoicePDF(invoiceId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoiceId}.pdf"`);
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
