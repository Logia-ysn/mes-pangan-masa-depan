
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
        const data = await handler(req, res);

        // If the handler already sent a response (e.g. res.send), don't send again.
        // Naiv framework might handle return values as responses. 
        // We will return data so Naiv can handle it, OR we can send it here.
        // Safer approach given Naiv's behavior (observed in T_ handlers): return data.
        return data;
    } catch (error: any) {
        console.error('API Error:', error);

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
