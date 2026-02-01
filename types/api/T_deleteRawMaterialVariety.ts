import { Response } from "express";

export interface T_deleteRawMaterialVariety_Request {
    headers: { authorization?: string };
    path: { id: number };
}

export interface T_deleteRawMaterialVariety_Response {
    success: boolean;
    message: string;
}

export type T_deleteRawMaterialVariety = (
    req: T_deleteRawMaterialVariety_Request,
    res: Response
) => Promise<T_deleteRawMaterialVariety_Response>;

export const T_deleteRawMaterialVariety_Endpoint = {
    method: 'delete' as const,
    path: '/raw-material-varieties/:id',
    requireAuth: true
};
