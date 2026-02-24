
import { Request, Response } from 'express'; // Assuming express types are used/compatible
import { AppError } from './errors';

type ApiHandler = (req: any, res: any) => Promise<any>;

/**
 * Higher-Order Function to wrap API handlers with:
 * 1. Global Error Handling
 * 2. Standardized Response Format (Optional, but recommended)
 */
export const apiWrapper = (handler: ApiHandler) => async (req: any, res: any) => {
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
        }

        const data = await handler(req, res);

        // If the handler already sent a response (e.g. res.send), don't send again.
        // Naiv framework might handle return values as responses. 
        // We will return data so Naiv can handle it, OR we can send it here.
        // Safer approach given Naiv's behavior (observed in T_ handlers): return data.
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
        } else {
            // Unhandled Error
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred'
                }
            });
        }

        // Return null/undefined so Naiv doesn't try to send another response
        return;
    }
};
