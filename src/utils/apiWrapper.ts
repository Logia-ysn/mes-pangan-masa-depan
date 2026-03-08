
import { Request, Response } from 'express'; // Assuming express types are used/compatible
import { AppError } from './errors';

type ApiHandler = (req: any, res: any) => Promise<any>;

/**
 * Higher-Order Function to wrap API handlers with:
 * 1. Global Error Handling
 * 2. Standardized Response Format (Optional, but recommended)
 */
export const apiWrapper = (handler: ApiHandler) => async (req: any, res: any) => {
    if (res && !res.__isPatchedForNaiv) {
        res.__isPatchedForNaiv = true;
        const oJson = res.json;
        res.json = function (...args: any[]) {
            if (this.headersSent) return this;
            return oJson.apply(this, args);
        };
        const oSend = res.send;
        res.send = function (...args: any[]) {
            if (this.headersSent) return this;
            return oSend.apply(this, args);
        };
        const oStatus = res.status;
        res.status = function (code: number) {
            if (this.headersSent) return this;
            return oStatus.apply(this, arguments as any);
        };
    }

    try {
        // NAIV filters the request object. We enrich it back from the raw Express request (res.req)
        // to ensure requireAuth and other utilities can see headers and cookies.
        if (res && res.req) {
            req.headers = { ...res.req.headers, ...req.headers }; // Merge both
            req.cookies = res.req.cookies || req.cookies;
            req.method = res.req.method || req.method;
            req.url = res.req.url || req.url;
            // Some Express props (query, params) are read-only getters — safely try to set
            try { req.query = res.req.query || req.query; } catch (_) { }
            try { req.params = res.req.params || req.params; } catch (_) { }
            // NAIV sets req.path as an object with route params (e.g. req.path.id)
            // When handlers are manually mounted via server.express, req.path is a string (URL).
            // Populate req.path from Express params so all handlers work universally.
            if (typeof req.path === 'string' || !req.path) {
                try {
                    Object.defineProperty(req, 'path', {
                        value: res.req.params || {},
                        writable: true,
                        configurable: true
                    });
                } catch (_) { /* req.path may be locked — handler must use req.params */ }
            }
        }

        const data = await handler(req, res);

        // If the handler already sent a response (e.g. res.send), don't send again.
        // Naiv framework might handle return values as responses. 
        // We will return data so Naiv can handle it, OR we can send it here.
        // Safer approach given Naiv's behavior (observed in T_ handlers): return data.
        if (data !== undefined && !res.headersSent) {
            res.json(data);
        }
        return data;
    } catch (error: any) {
        console.error('API Error:', error);

        // Log to file for debugging
        const fs = require('fs');
        const logFile = '/tmp/erp-pmd-api-error.log';

        fs.appendFileSync(
            logFile,
            `\n[${new Date().toISOString()}] ${req.method || 'GET'} ${req.url || '/'}\n${error.stack || error}\n`
        );

        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.constructor.name,
                    message: error.message,
                    details: (error as any).errors || undefined
                }
            });
        } else if (error.constructor?.name === 'PrismaClientValidationError') {
            // Prisma validation error (bad enum value, missing field, etc.)
            // Extract useful message from Prisma error
            const match = error.message?.match(/Invalid value.*?Expected\s+(\S+)/);
            const hint = match ? `Invalid value. Expected: ${match[1]}` : 'Invalid request data';
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: hint
                }
            });
        } else if (error.constructor?.name === 'PrismaClientKnownRequestError') {
            // Prisma known errors (unique constraint, foreign key, etc.)
            const code = error.code === 'P2002' ? 'DUPLICATE_ENTRY'
                : error.code === 'P2003' ? 'FOREIGN_KEY_ERROR'
                    : error.code === 'P2025' ? 'NOT_FOUND'
                        : 'DATABASE_ERROR';
            const status = error.code === 'P2025' ? 404 : 409;
            res.status(status).json({
                success: false,
                error: {
                    code,
                    message: error.meta?.cause || error.message || 'Database operation failed'
                }
            });
        } else {
            // Unhandled Error — show details in development
            const isDev = process.env.NODE_ENV !== 'production';
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: isDev ? (error.message || 'An unexpected error occurred') : 'An unexpected error occurred'
                }
            });
        }

        // Return null/undefined so Naiv doesn't try to send another response
        return;
    }
};
