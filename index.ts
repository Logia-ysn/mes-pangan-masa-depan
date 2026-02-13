import 'reflect-metadata';
import { prisma } from './src/libs/prisma';
import { Server } from '@naiv/codegen-nodejs-typeorm';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getUserFromToken } from './utility/auth';
import { pdfService } from './src/services/pdf.service';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const server = new Server({ noCors: true });

// Trust proxy for secure cookies in production (Railway/Vercel)
server.express.set('trust proxy', 1);

// --- CORS with credentials ---
server.express.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// --- Cookie parser ---
server.express.use(cookieParser());

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
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts' } },
});

server.express.use(globalLimiter);
server.express.use('/auth/login', authLimiter);
server.express.use('/auth/register', authLimiter);

// --- Health check ---
server.express.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Invoice PDF export ---
server.express.get('/invoices/:id/pdf', async (req, res) => {
  try {
    await getUserFromToken(req);

    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid invoice ID' } });
    }

    const doc = await pdfService.generateInvoicePDF(invoiceId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoiceId}.pdf"`);
    doc.pipe(res);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, error: { message: error.message || 'Failed to generate PDF' } });
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
server.run({
  port: +(process.env.PORT ?? 9415),
  types_path: path.resolve(__dirname, 'types'),
  implementation_path: path.resolve(__dirname, 'implementation'),
  async beforeStart() {
    await prisma.$connect();
    console.log('Prisma connected');
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
