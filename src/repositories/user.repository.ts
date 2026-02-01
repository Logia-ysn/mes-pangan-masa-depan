/**
 * User Repository
 * Handles all database operations for User entity
 * 
 * RULES:
 * - Only database operations
 * - No password hashing (that's service layer)
 * - No token generation (that's service layer)
 */

import { BaseRepository } from './base.repository';
import { User } from '../../types/model/table/User';
import { FindManyOptions, Like } from 'typeorm';

export interface UserListParams {
    limit?: number;
    offset?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
}

export class UserRepository extends BaseRepository<User> {
    protected entity = User;

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return await User.findOne({
            where: { email }
        });
    }

    /**
     * Find active user by email
     */
    async findActiveByEmail(email: string): Promise<User | null> {
        return await User.findOne({
            where: { email, is_active: true }
        });
    }

    /**
     * Find user by ID (only active users)
     */
    async findActiveById(id: number): Promise<User | null> {
        return await User.findOne({
            where: { id, is_active: true }
        });
    }

    /**
     * Find all users with filtering
     */
    async findWithFilters(params: UserListParams): Promise<{ users: User[], total: number }> {
        const options: FindManyOptions<User> = {
            take: params.limit || 10,
            skip: params.offset || 0,
            order: { id: 'DESC' }
        };

        const where: any = {};

        if (params.search) {
            where.fullname = Like(`%${params.search}%`);
        }

        if (params.role) {
            where.role = params.role;
        }

        if (params.is_active !== undefined) {
            where.is_active = params.is_active;
        }

        if (Object.keys(where).length > 0) {
            options.where = where;
        }

        const [users, total] = await User.findAndCount(options);
        return { users, total };
    }

    /**
     * Check if email exists
     */
    async emailExists(email: string): Promise<boolean> {
        const count = await User.count({ where: { email } });
        return count > 0;
    }

    /**
     * Update password hash
     */
    async updatePassword(id: number, passwordHash: string): Promise<boolean> {
        const user = await this.findById(id);
        if (!user) return false;

        user.password_hash = passwordHash;
        user.updated_at = new Date();
        await user.save();
        return true;
    }

    /**
     * Deactivate user (soft delete)
     */
    async deactivate(id: number): Promise<boolean> {
        const user = await this.findById(id);
        if (!user) return false;

        user.is_active = false;
        user.updated_at = new Date();
        await user.save();
        return true;
    }
}

// Singleton instance
export const userRepository = new UserRepository();
