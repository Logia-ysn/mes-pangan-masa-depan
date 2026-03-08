import { batchGenealogyService } from '../src/services/batch-genealogy.service';
import { getUserFromToken } from '../utility/auth';
import { Request, Response } from 'express';

export const traceForward = async (req: Request, res: Response) => {
    try {
        await getUserFromToken(req);
        const { batchCode } = req.params;
        const data = await batchGenealogyService.traceForward(batchCode as string);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};

export const traceBackward = async (req: Request, res: Response) => {
    try {
        await getUserFromToken(req);
        const { batchCode } = req.params;
        const data = await batchGenealogyService.traceBackward(batchCode as string);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};
