import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { User, User_role_enum } from '@prisma/client';
import { prisma } from '../src/libs/prisma';
import { UnauthorizedError, ForbiddenError } from '../src/utils/errors';

// SECURITY: Throw error if JWT_SECRET is not set - never use a fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start without it.');
}
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

// Role hierarchy: higher index = more privileges
const ROLE_HIERARCHY: Record<string, number> = {
    OPERATOR: 1,
    SUPERVISOR: 2,
    MANAGER: 3,
    ADMIN: 4,
    SUPERUSER: 5,
};

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
        throw new UnauthorizedError('Invalid or expired token');
    }
};

export const extractToken = (req: any): string => {
    // 1. Check Authorization header first
    const auth = req.headers?.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    // 2. Fall back to httpOnly cookie
    if (req.cookies?.token) return req.cookies.token;
    throw new UnauthorizedError('Authorization required');
};

export const getUserFromToken = async (req: any): Promise<User> => {
    const token = extractToken(req);
    const payload = verifyToken(token);

    const user = await prisma.user.findFirst({
        where: { id: payload.userId, is_active: true }
    });

    if (!user) {
        throw new UnauthorizedError('User not found or inactive');
    }

    return user;
};

/**
 * Require authenticated user with minimum role level.
 * Throws if not authenticated or insufficient privileges.
 *
 * Usage: const user = await requireAuth(req.headers.authorization, 'ADMIN');
 */
export const requireAuth = async (
    req: any,
    minimumRole: keyof typeof ROLE_HIERARCHY = 'OPERATOR'
): Promise<User> => {
    const user = await getUserFromToken(req);

    const userLevel = ROLE_HIERARCHY[user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
        throw new ForbiddenError(`Access denied. Required role: ${minimumRole} or higher.`);
    }

    return user;
};

/**
 * Strip sensitive fields (password_hash) from user object before returning to client.
 */
export const sanitizeUser = (user: User): Omit<User, 'password_hash'> => {
    const { password_hash, ...safeUser } = user;
    return safeUser;
};
