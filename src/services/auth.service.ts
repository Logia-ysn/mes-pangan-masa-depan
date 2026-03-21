/**
 * Auth Service
 * Handles authentication business logic using Prisma
 */

import { User, User_role_enum } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword, generateToken, verifyToken, extractToken } from '../../utility/auth';
import { UnauthorizedError, ValidationError, NotFoundError, ConflictError } from '../utils/errors';
import { auditService } from './audit.service';

export interface LoginDTO {
    email: string;
    password: string;
}

export interface RegisterDTO {
    email: string;
    password: string;
    fullname: string;
    role?: string;
}

export interface AuthResult {
    token: string;
    user: User;
}

export interface ChangePasswordDTO {
    userId: number;
    currentPassword: string;
    newPassword: string;
}

class AuthService {
    /**
     * Authenticate user and return token
     */
    async login(dto: LoginDTO): Promise<AuthResult> {
        // Find active user by email
        const user = await userRepository.findActiveByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await comparePassword(dto.password, user.password_hash);

        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Generate token
        const token = generateToken(user as any);

        // Audit Log for Login
        await auditService.log({
            userId: user.id,
            action: 'LOGIN',
            tableName: 'User',
            recordId: user.id,
            newValue: { email: user.email, role: user.role }
        });

        return { token, user };
    }

    /**
     * Register new user
     */
    async register(dto: RegisterDTO): Promise<AuthResult> {
        // Check if email already exists
        const existingUser = await userRepository.emailExists(dto.email);

        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // Validate password strength
        if (dto.password.length < 12) {
            throw new ValidationError('Password must be at least 12 characters');
        }

        // Hash password
        const passwordHash = await hashPassword(dto.password);

        // SECURITY: Always create new users as OPERATOR regardless of what was passed
        // Only ADMIN/SUPERUSER can change roles via the updateUser endpoint
        const user = await userRepository.create({
            email: dto.email,
            password_hash: passwordHash,
            fullname: dto.fullname,
            role: User_role_enum.OPERATOR,
            is_active: true
        });

        // Generate token
        const token = generateToken(user as any);

        return { token, user };
    }

    /**
     * Get user from authorization token
     */
    async getUserFromToken(req: any): Promise<User> {
        const token = extractToken(req);
        const payload = verifyToken(token);

        const user = await userRepository.findActiveById(payload.userId);

        if (!user) {
            throw new UnauthorizedError('User not found or inactive');
        }

        return user;
    }

    /**
     * Change user password
     */
    async changePassword(dto: ChangePasswordDTO): Promise<boolean> {
        const user = await userRepository.findById(dto.userId);

        if (!user) {
            throw new NotFoundError('User', dto.userId);
        }

        // Verify current password
        const isValidPassword = await comparePassword(dto.currentPassword, user.password_hash);

        if (!isValidPassword) {
            throw new ValidationError('Current password is incorrect');
        }

        // Validate new password
        if (dto.newPassword.length < 12) {
            throw new ValidationError('New password must be at least 12 characters');
        }

        // Hash and update password
        const newPasswordHash = await hashPassword(dto.newPassword);
        await userRepository.updatePassword(dto.userId, newPasswordHash);

        // Audit Log for Password Change
        await auditService.log({
            userId: dto.userId,
            action: 'UPDATE',
            tableName: 'User',
            recordId: dto.userId,
            newValue: { type: 'PASSWORD_CHANGE' }
        });

        return true;
    }

    /**
     * Validate token (without fetching user)
     */
    validateToken(req: any): boolean {
        try {
            const token = extractToken(req);
            verifyToken(token);
            return true;
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const authService = new AuthService();
