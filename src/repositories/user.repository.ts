/**
 * User Repository
 * Handles all database operations for User entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { User, User_role_enum } from '@prisma/client';

export interface UserListParams {
    limit?: number;
    offset?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
}

export class UserRepository extends BaseRepository<User> {
    protected modelName = 'User';

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return await this.model.findFirst({
            where: { email }
        });
    }

    /**
     * Find active user by email
     */
    async findActiveByEmail(email: string): Promise<User | null> {
        return await this.model.findFirst({
            where: { email, is_active: true }
        });
    }

    /**
     * Find user by ID (only active users)
     */
    async findActiveById(id: number): Promise<User | null> {
        return await this.model.findFirst({
            where: { id, is_active: true }
        });
    }

    /**
     * Find all users with filtering
     */
    async findWithFilters(params: UserListParams): Promise<{ users: User[], total: number }> {
        const where: any = {};

        if (params.search) {
            where.fullname = { contains: params.search, mode: 'insensitive' };
        }

        if (params.role) {
            where.role = params.role as User_role_enum;
        }

        if (params.is_active !== undefined) {
            where.is_active = params.is_active;
        }

        const [users, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 10,
                skip: params.offset || 0,
                orderBy: { id: 'desc' }
            }),
            this.model.count({ where })
        ]);

        return { users, total };
    }

    /**
     * Check if email exists
     */
    async emailExists(email: string): Promise<boolean> {
        const count = await this.model.count({ where: { email } });
        return count > 0;
    }

    /**
     * Update password hash
     */
    async updatePassword(id: number, passwordHash: string): Promise<boolean> {
        try {
            await this.model.update({
                where: { id },
                data: {
                    password_hash: passwordHash
                }
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Deactivate user (soft delete)
     */
    async deactivate(id: number): Promise<boolean> {
        try {
            await this.model.update({
                where: { id },
                data: {
                    is_active: false
                }
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Singleton instance
export const userRepository = new UserRepository();
