import { Request, Response } from 'express';

export const method = 'put';
export const url_path = '/users/:id/reset-password';
export const alias = 'T_resetUserPassword';

export type T_resetUserPassword = (
    req: Request<
        { id: string },             // params (as string from URL)
        {},                          // res body
        { new_password: string },    // req body
        {},                          // query
        { authorization: string }    // headers
    >,
    res: Response
) => Promise<void>;
