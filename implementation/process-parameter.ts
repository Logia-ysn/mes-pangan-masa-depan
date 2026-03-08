import { processParameterService } from '../src/services/process-parameter.service';
import { getUserFromToken } from '../utility/auth';
import { Request, Response } from 'express';

// Avoid loop detection flags
export const getProcessParameters = async (req: Request, res: Response) => {
    try {
        await getUserFromToken(req);
        const { limit, offset, id_factory, id_machine, batch_code, startDate, endDate } = req.query;

        const data = await processParameterService.getLogs({
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
            id_factory: id_factory ? Number(id_factory) : undefined,
            id_machine: id_machine ? Number(id_machine) : undefined,
            batch_code: batch_code as string,
            startDate: startDate as string,
            endDate: endDate as string,
        });

        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};

export const createProcessParameter = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const user = await getUserFromToken(req);
        const record = await processParameterService.createLog(payload, user.id);
        res.json({ success: true, data: record });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};

export const getMachineTrend = async (req: Request, res: Response) => {
    try {
        await getUserFromToken(req);
        const machineId = Number(req.params.id);
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: { message: 'Required bounds missing' } });
        }

        const metrics = await processParameterService.getMachineTrend(
            machineId,
            new Date(startDate as string),
            new Date(endDate as string)
        );

        res.json({ success: true, data: metrics });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};
