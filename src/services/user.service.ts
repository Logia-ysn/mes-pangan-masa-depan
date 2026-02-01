/**
 * User Service
 * Handles user management business logic
 * 
 * RULES:
 * - No HTTP request/response objects
 * - No direct database queries (use repositories)
 * - Pure business logic only
 */

import { User } from '../../types/model/table/User';
import { UserRole } from '../../types/model/enum/UserRole';
import { userRepository, UserListParams } from '../repositories/user.repository';
import { hashPassword } from '../../utility/auth';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export interface CreateUserDTO {
    email: string;
    password: string;
    fullname: string;
    role?: string;
    is_active?: boolean;
}

export interface UpdateUserDTO {
    id: number;
    email?: string;
    fullname?: string;
    role?: string;
    is_active?: boolean;
}

class UserService {
    /**
     * Get user by ID
     */
    async getUserById(id: number): Promise<User> {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new NotFoundError('User', id);
        }
        return user;
    }

    /**
     * Get all users with filters
     */
    async getUsers(params: UserListParams): Promise<{ users: User[], total: number }> {
        return await userRepository.findWithFilters(params);
    }

    /**
     * Create new user
     */
    async createUser(dto: CreateUserDTO): Promise<User> {
        // Validate email format
        if (!this.isValidEmail(dto.email)) {
            throw new ValidationError('Invalid email format');
        }

        // Check email uniqueness
        if (await userRepository.emailExists(dto.email)) {
            throw new ConflictError('Email already registered');
        }

        // Validate password
        if (dto.password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters');
        }

        // Hash password
        const passwordHash = await hashPassword(dto.password);

        // Create user
        return await userRepository.create({
            email: dto.email,
            password_hash: passwordHash,
            fullname: dto.fullname,
            role: (dto.role || 'OPERATOR') as UserRole,
            is_active: dto.is_active !== undefined ? dto.is_active : true
        }) as User;
    }

    /**
     * Update user
     */
    async updateUser(dto: UpdateUserDTO): Promise<User> {
        const user = await userRepository.findById(dto.id);
        if (!user) {
            throw new NotFoundError('User', dto.id);
        }

        // Check email uniqueness if changing email
        if (dto.email && dto.email !== user.email) {
            if (await userRepository.emailExists(dto.email)) {
                throw new ConflictError('Email already registered');
            }
            user.email = dto.email;
        }

        if (dto.fullname) user.fullname = dto.fullname;
        if (dto.role) user.role = dto.role as UserRole;
        if (dto.is_active !== undefined) user.is_active = dto.is_active;
        user.updated_at = new Date();

        await user.save();
        return user;
    }

    /**
     * Delete user (soft delete - deactivate)
     */
    async deleteUser(id: number): Promise<boolean> {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new NotFoundError('User', id);
        }

        return await userRepository.deactivate(id);
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Singleton instance
export const userService = new UserService();
