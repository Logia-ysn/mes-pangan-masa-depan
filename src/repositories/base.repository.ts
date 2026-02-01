/**
 * Base Repository
 * Provides generic CRUD operations for all entity repositories
 * 
 * RULES:
 * - Only database operations here
 * - No business logic
 * - No HTTP request/response objects
 */

import { BaseEntity, FindManyOptions, FindOneOptions, FindOptionsWhere, DeepPartial } from 'typeorm';

export interface IBaseRepository<T> {
    findAll(options?: FindManyOptions<T>): Promise<T[]>;
    findById(id: number): Promise<T | null>;
    findOne(options: FindOneOptions<T>): Promise<T | null>;
    create(data: DeepPartial<T>): Promise<T>;
    update(id: number, data: DeepPartial<T>): Promise<T>;
    delete(id: number): Promise<boolean>;
    count(options?: FindManyOptions<T>): Promise<number>;
}

export abstract class BaseRepository<T extends BaseEntity> implements IBaseRepository<T> {
    protected abstract entity: { new(): T } & typeof BaseEntity;

    /**
     * Find all entities with optional filtering and pagination
     */
    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return await this.entity.find(options as any) as T[];
    }

    /**
     * Find entity by ID
     */
    async findById(id: number): Promise<T | null> {
        return await this.entity.findOne({
            where: { id } as any
        }) as T | null;
    }

    /**
     * Find one entity matching criteria
     */
    async findOne(options: FindOneOptions<T>): Promise<T | null> {
        return await this.entity.findOne(options as any) as T | null;
    }

    /**
     * Find entity by custom where clause
     */
    async findByWhere(where: FindOptionsWhere<T>): Promise<T | null> {
        return await this.entity.findOne({ where } as any) as T | null;
    }

    /**
     * Create new entity
     */
    async create(data: DeepPartial<T>): Promise<T> {
        const instance = this.entity.create(data as any) as T;
        await (instance as BaseEntity).save();
        return instance;
    }

    /**
     * Update existing entity
     */
    async update(id: number, data: DeepPartial<T>): Promise<T> {
        const entity = await this.findById(id);
        if (!entity) {
            throw new Error(`Entity with id ${id} not found`);
        }
        Object.assign(entity, data);
        await (entity as BaseEntity).save();
        return entity;
    }

    /**
     * Delete entity by ID (hard delete)
     */
    async delete(id: number): Promise<boolean> {
        const entity = await this.findById(id);
        if (!entity) {
            return false;
        }
        await (entity as BaseEntity).remove();
        return true;
    }

    /**
     * Count entities matching criteria
     */
    async count(options?: FindManyOptions<T>): Promise<number> {
        return await this.entity.count(options as any);
    }

    /**
     * Check if entity exists
     */
    async exists(id: number): Promise<boolean> {
        const count = await this.entity.count({
            where: { id } as any
        });
        return count > 0;
    }
}
