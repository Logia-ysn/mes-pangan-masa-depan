/**
 * Response Helpers
 * Standardized response formatting for all API endpoints
 */

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ListParams {
    limit?: number;
    offset?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * Converts offset/limit to page-based pagination
 */
export function toPaginatedResult<T>(
    data: T[],
    total: number,
    params: ListParams
): PaginatedResult<T> {
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const page = params.page || Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        total,
        page,
        limit,
        totalPages
    };
}

/**
 * Parse list parameters from request query
 */
export function parseListParams(query: any): ListParams {
    return {
        limit: query.limit ? parseInt(query.limit, 10) : 10,
        offset: query.offset ? parseInt(query.offset, 10) : 0,
        page: query.page ? parseInt(query.page, 10) : undefined,
        sortBy: query.sortBy || 'id',
        sortOrder: query.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    };
}
