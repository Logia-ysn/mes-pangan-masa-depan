/**
 * Auth Service
 * Handles authentication business logic
 * 
 * RULES:
 * - No HTTP request/response objects
 * - No direct database queries (use repositories)
 * - Pure business logic only
 */

import { User } from '../../types/model/table/User';
import { UserRole } from '../../types/model/enum/UserRole';
import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword, generateToken, verifyToken, extractToken } from '../../utility/auth';
import { UnauthorizedError, ValidationError, NotFoundError, ConflictError } from '../utils/errors';

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
        const token = generateToken(user);

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
        if (dto.password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters');
        }

        // Hash password
        const passwordHash = await hashPassword(dto.password);

        // Create user
        const user = await userRepository.create({
            email: dto.email,
            password_hash: passwordHash,
            fullname: dto.fullname,
            role: (dto.role || 'OPERATOR') as UserRole,
            is_active: true
        }) as User;

        // Generate token
        const token = generateToken(user);

        return { token, user };
    }

    /**
     * Get user from authorization token
     */
    async getUserFromToken(authorization: string): Promise<User> {
        if (!authorization) {
            throw new UnauthorizedError('Authorization header is required');
        }

        const token = extractToken(authorization);
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
        if (dto.newPassword.length < 6) {
            throw new ValidationError('New password must be at least 6 characters');
        }

        // Hash and update password
        const newPasswordHash = await hashPassword(dto.newPassword);
        await userRepository.updatePassword(dto.userId, newPasswordHash);

        return true;
    }

    /**
     * Validate token (without fetching user)
     */
    validateToken(authorization: string): boolean {
        try {
            const token = extractToken(authorization);
            verifyToken(token);
            return true;
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const authService = new AuthService();
