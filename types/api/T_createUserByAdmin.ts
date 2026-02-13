import { Request, Response } from 'express';

export const method = 'post';
export const url_path = '/users';
export const alias = 'T_createUserByAdmin';

export type T_createUserByAdmin = (
    req: Request<
        {},                          // params
        {},                          // res body
        {                            // req body
            email: string;
            password: string;
            fullname: string;
            role?: string;           // default OPERATOR
            id_factory?: number;
        },
        {},                          // query
        { authorization: string }    // headers
    >,
    res: Response
) => Promise<void>;
