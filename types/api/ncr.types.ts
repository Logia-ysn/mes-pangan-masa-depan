import { Request, Response } from 'express';

export type T_getNCRs = (req: Request, res: Response) => Promise<any>;
export type T_getNCRById = (req: Request, res: Response) => Promise<any>;
export type T_createNCR = (req: Request, res: Response) => Promise<any>;
export type T_updateNCR = (req: Request, res: Response) => Promise<any>;
export type T_resolveNCR = (req: Request, res: Response) => Promise<any>;
export type T_deleteNCR = (req: Request, res: Response) => Promise<any>;
