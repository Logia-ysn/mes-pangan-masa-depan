import { shiftHandoverService } from '../src/services/shift-handover.service';
import { getUserFromToken } from '../utility/auth';
import { Request, Response } from 'express';

export const createHandover = async (req: Request, res: Response) => {
    try {
        const user = await getUserFromToken(req);
        const data = await shiftHandoverService.createLog(req.body, user.id);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};

export const acknowledgeHandover = async (req: Request, res: Response) => {
    try {
        const user = await getUserFromToken(req);
        const { id } = req.params;
        const data = await shiftHandoverService.acknowledgeLog(Number(id), user.id);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};

export const getHandovers = async (req: Request, res: Response) => {
    try {
        await getUserFromToken(req);
        const data = await shiftHandoverService.getLogs(req.query);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
};
