/**
 * User Service
 * Handles user management business logic using Prisma
 */

import { User, User_role_enum } from '@prisma/client';
import { userRepository, UserListParams } from '../repositories/user.repository';
import { hashPassword } from '../../utility/auth';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export interface CreateUserDTO {
    email: string;
    password: string;
    fullname: string;
    role?: string;
    id_factory?: number;
    is_active?: boolean;
}

export interface UpdateUserDTO {
    id: number;
    email?: string;
    fullname?: string;
    role?: string;
    id_factory?: number;
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
            role: (dto.role || 'OPERATOR') as User_role_enum,
            id_factory: dto.id_factory,
            is_active: dto.is_active !== undefined ? dto.is_active : true
        });
    }

    /**
     * Update user
     */
    async updateUser(dto: UpdateUserDTO): Promise<User> {
        const user = await userRepository.findById(dto.id);
        if (!user) {
            throw new NotFoundError('User', dto.id);
        }

        const data: any = {};

        // Check email uniqueness if changing email
        if (dto.email && dto.email !== user.email) {
            if (await userRepository.emailExists(dto.email)) {
                throw new ConflictError('Email already registered');
            }
            data.email = dto.email;
        }

        if (dto.fullname) data.fullname = dto.fullname;
        if (dto.role) data.role = dto.role as User_role_enum;
        if (dto.id_factory !== undefined) data.id_factory = dto.id_factory;
        if (dto.is_active !== undefined) data.is_active = dto.is_active;
        data.updated_at = new Date();

        return await userRepository.update(dto.id, data);
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
