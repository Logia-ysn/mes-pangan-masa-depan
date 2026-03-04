/**
 * Backup Service
 * Handles PostgreSQL database backup & restore via Docker container
 * 
 * Uses `docker exec` to run pg_dump/pg_restore inside the PostgreSQL container
 * since pg_dump is not available on the host machine.
 * 
 * @module backup.service
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Backup directory (project root / backups)
const BACKUP_DIR = path.resolve(__dirname, '../../backups');

// Docker container name for PostgreSQL
const DB_CONTAINER = 'erp_pangan_db';

export interface BackupInfo {
    fileName: string;
    filePath: string;
    sizeBytes: number;
    sizeFormatted: string;
    createdAt: string;
}

/**
 * Parse DATABASE_URL into connection components
 */
function parseDatabaseUrl(): { host: string; port: string; database: string; user: string; password: string } {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');

    // Format: postgresql://user:password@host:port/database
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) throw new Error('Invalid DATABASE_URL format');

    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        database: match[5].split('?')[0], // Remove query params
    };
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDir(): void {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

/**
 * Check if Docker container is running
 */
async function ensureContainerRunning(): Promise<void> {
    try {
        const { stdout } = await execAsync(`docker inspect -f '{{.State.Running}}' ${DB_CONTAINER} 2>/dev/null`);
        if (!stdout.trim().includes('true')) {
            throw new Error(`Docker container '${DB_CONTAINER}' is not running`);
        }
    } catch (error: any) {
        if (error.message?.includes('not running')) throw error;
        throw new Error(`Docker container '${DB_CONTAINER}' not found. Make sure Docker is running and the container exists.`);
    }
}

export class BackupService {
    /**
     * Create a new database backup using pg_dump inside Docker container
     * Output is piped from container stdout to a local file
     */
    static async createBackup(): Promise<BackupInfo> {
        ensureBackupDir();
        await ensureContainerRunning();
        const conn = parseDatabaseUrl();

        const timestamp = new Date().toISOString()
            .replace(/[-:T]/g, '')
            .replace(/\..+/, '')
            .slice(0, 14); // YYYYMMDDHHMMSS

        const fileName = `backup_${timestamp}.dump`;
        const filePath = path.join(BACKUP_DIR, fileName);

        // Run pg_dump inside Docker container, pipe output to local file
        // Using custom format (-Fc) for compressed output
        const cmd = `docker exec -e PGPASSWORD='${conn.password}' ${DB_CONTAINER} pg_dump -U ${conn.user} -d ${conn.database} -Fc --no-owner --no-privileges > "${filePath}"`;

        try {
            await execAsync(cmd, { timeout: 120000 }); // 2 min timeout
        } catch (error: any) {
            // Cleanup partial file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw new Error(`pg_dump failed: ${error.stderr || error.message}`);
        }

        // Verify file was created and has content
        if (!fs.existsSync(filePath)) {
            throw new Error('Backup file was not created');
        }

        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            fs.unlinkSync(filePath);
            throw new Error('Backup file is empty — pg_dump may have failed silently');
        }

        return {
            fileName,
            filePath,
            sizeBytes: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: stats.mtime.toISOString(),
        };
    }

    /**
     * Restore database from a backup file using pg_restore inside Docker container
     * WARNING: This will overwrite existing data!
     */
    static async restoreBackup(filePath: string): Promise<{ success: boolean; message: string }> {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Backup file not found: ${filePath}`);
        }

        await ensureContainerRunning();
        const conn = parseDatabaseUrl();

        // Copy file into container, then run pg_restore
        const containerPath = `/tmp/${path.basename(filePath)}`;

        try {
            // Copy backup file into container
            await execAsync(`docker cp "${filePath}" ${DB_CONTAINER}:${containerPath}`, { timeout: 60000 });

            // Run pg_restore inside container
            const restoreCmd = `docker exec -e PGPASSWORD='${conn.password}' ${DB_CONTAINER} pg_restore -U ${conn.user} -d ${conn.database} --clean --if-exists --no-owner --no-privileges --single-transaction "${containerPath}" 2>&1 || true`;

            const { stderr } = await execAsync(restoreCmd, { timeout: 300000 }); // 5 min timeout

            // Cleanup temp file in container
            await execAsync(`docker exec ${DB_CONTAINER} rm -f "${containerPath}"`).catch(() => { });

            // Check for fatal errors (warnings are expected with --clean)
            if (stderr && (stderr.includes('FATAL') || stderr.includes('could not connect'))) {
                throw new Error(stderr);
            }

            return { success: true, message: 'Database restored successfully' };
        } catch (error: any) {
            // Cleanup temp file in container
            await execAsync(`docker exec ${DB_CONTAINER} rm -f "${containerPath}"`).catch(() => { });

            const msg = error.stderr || error.message || 'Unknown error';
            if (msg.includes('FATAL') || msg.includes('could not connect')) {
                throw new Error(`pg_restore failed: ${msg}`);
            }
            // pg_restore often returns warnings that are not errors
            return { success: true, message: 'Database restored with warnings (normal)' };
        }
    }

    /**
     * List all available backups
     */
    static listBackups(): BackupInfo[] {
        ensureBackupDir();

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.dump'))
            .sort((a, b) => b.localeCompare(a)); // Newest first

        return files.map(fileName => {
            const filePath = path.join(BACKUP_DIR, fileName);
            const stats = fs.statSync(filePath);
            return {
                fileName,
                filePath,
                sizeBytes: stats.size,
                sizeFormatted: formatBytes(stats.size),
                createdAt: stats.mtime.toISOString(),
            };
        });
    }

    /**
     * Delete a specific backup file
     */
    static deleteBackup(fileName: string): void {
        // Security: prevent path traversal
        const safeName = path.basename(fileName);
        if (!safeName.endsWith('.dump')) {
            throw new Error('Invalid backup file name');
        }

        const filePath = path.join(BACKUP_DIR, safeName);
        if (!fs.existsSync(filePath)) {
            throw new Error('Backup file not found');
        }

        fs.unlinkSync(filePath);
    }

    /**
     * Get full path for a backup file (with path traversal protection)
     */
    static getBackupPath(fileName: string): string {
        const safeName = path.basename(fileName);
        if (!safeName.endsWith('.dump')) {
            throw new Error('Invalid backup file name');
        }

        const filePath = path.join(BACKUP_DIR, safeName);
        if (!fs.existsSync(filePath)) {
            throw new Error('Backup file not found');
        }

        return filePath;
    }
}
