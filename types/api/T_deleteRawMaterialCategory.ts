import { Response } from "express";

export interface T_deleteRawMaterialCategory_Request {
    headers: { authorization?: string };
    path: { id: number };
}

export interface T_deleteRawMaterialCategory_Response {
    success: boolean;
    message: string;
}

export type T_deleteRawMaterialCategory = (
    req: T_deleteRawMaterialCategory_Request,
    res: Response
) => Promise<T_deleteRawMaterialCategory_Response>;

export const T_deleteRawMaterialCategory_Endpoint = {
    method: 'delete' as const,
    path: '/raw-material-categories/:id',
    requireAuth: true
};
