import { prisma } from '../libs/prisma';

export class SequenceService {
    /**
     * Gets the next sequence number for a given key and date.
     * Thread-safe / concurrent-safe increment using Prisma.
     */
    async getNextSequence(sequenceKey: string, date: Date = new Date()): Promise<number> {
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        // We use upsert to create or update atomically
        const result = await prisma.batchSequence.upsert({
            where: {
                sequence_key_sequence_date: {
                    sequence_key: sequenceKey,
                    sequence_date: dateOnly
                }
            },
            update: {
                last_number: {
                    increment: 1
                }
            },
            create: {
                sequence_key: sequenceKey,
                sequence_date: dateOnly,
                last_number: 1
            }
        });

        return result.last_number;
    }
}

export const sequenceService = new SequenceService();
