/**
 * Base Repository (Prisma Version)
 * Provides generic CRUD operations for all entity repositories
 */

import { prisma } from '../libs/prisma';

export interface IBaseRepository<T> {
    findAll(params?: any): Promise<T[]>;
    findById(id: number): Promise<T | null>;
    create(data: any): Promise<T>;
    update(id: number, data: any): Promise<T>;
    delete(id: number): Promise<boolean>;
    count(params?: any): Promise<number>;
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
    protected abstract modelName: string;

    protected get model() {
        return (prisma as any)[this.modelName];
    }

    /**
     * Find all entities with optional filtering and pagination
     */
    async findAll(params?: any): Promise<T[]> {
        return await this.model.findMany(params);
    }

    /**
     * Find entity by ID
     */
    async findById(id: number): Promise<T | null> {
        return await this.model.findUnique({
            where: { id }
        });
    }

    /**
     * Find one entity matching criteria
     */
    async findOne(params: any): Promise<T | null> {
        return await this.model.findFirst(params);
    }

    /**
     * Create new entity
     */
    async create(data: any): Promise<T> {
        return await this.model.create({
            data
        });
    }

    /**
     * Update existing entity
     */
    async update(id: number, data: any): Promise<T> {
        return await this.model.update({
            where: { id },
            data
        });
    }

    /**
     * Delete entity by ID (hard delete)
     */
    async delete(id: number): Promise<boolean> {
        try {
            await this.model.delete({
                where: { id }
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false; // Record not found
            throw error; // Re-throw other real errors (FK constraints, etc.)
        }
    }

    /**
     * Count entities matching criteria
     */
    async count(params?: any): Promise<number> {
        return await this.model.count(params);
    }

    /**
     * Check if entity exists
     */
    async exists(id: number): Promise<boolean> {
        const count = await this.model.count({
            where: { id }
        });
        return count > 0;
    }
}
