import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { User } from '../types/model/table/User';

const JWT_SECRET = process.env.JWT_SECRET || 'erp-pangan-masa-depan-secret-key';
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

export const generateToken = (user: User): string => {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

export const extractToken = (authorization: string): string => {
    if (!authorization) {
        throw new Error('Authorization header is required');
    }
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new Error('Invalid authorization format. Use: Bearer <token>');
    }
    return parts[1] as string;
};

export const getUserFromToken = async (authorization: string): Promise<User> => {
    const token = extractToken(authorization);
    const payload = verifyToken(token);

    const user = await User.findOne({
        where: { id: payload.userId, is_active: true }
    });

    if (!user) {
        throw new Error('User not found or inactive');
    }

    return user;
};
