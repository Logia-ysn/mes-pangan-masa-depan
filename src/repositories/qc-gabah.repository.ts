/**
 * QC Gabah Repository
 * Handles all database operations for QCGabah entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { QCGabah } from '@prisma/client';

export class QCGabahRepository extends BaseRepository<QCGabah> {
    protected modelName = 'QCGabah';
}

// Singleton instance
export const qcGabahRepository = new QCGabahRepository();
