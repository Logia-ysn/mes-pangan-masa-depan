import { BaseRepository } from './base.repository';
import { QCGabah } from '../../types/model/table/QCGabah';

export class QCGabahRepository extends BaseRepository<QCGabah> {
    protected entity = QCGabah;
}

export const qcGabahRepository = new QCGabahRepository();
