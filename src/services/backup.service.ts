/**
 * Backup Service
 * Handles PostgreSQL database backup & restore using pg_dump / pg_restore
 * 
 * @module backup.service
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

// Backup directory (project root / backups)
const BACKUP_DIR = path.resolve(__dirname, '../../backups');

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

export class BackupService {
    /**
     * Create a new database backup using pg_dump
     * Output: custom format (.dump) for efficient storage and selective restore
     */
    static async createBackup(): Promise<BackupInfo> {
        ensureBackupDir();
        const conn = parseDatabaseUrl();

        const timestamp = new Date().toISOString()
            .replace(/[-:T]/g, '')
            .replace(/\..+/, '')
            .slice(0, 14); // YYYYMMDDHHMMSS

        const fileName = `backup_${timestamp}.dump`;
        const filePath = path.join(BACKUP_DIR, fileName);

        const env = {
            ...process.env,
            PGPASSWORD: conn.password,
        };

        try {
            await execFileAsync('pg_dump', [
                '-h', conn.host,
                '-p', conn.port,
                '-U', conn.user,
                '-d', conn.database,
                '-Fc',              // Custom format (compressed)
                '--no-owner',       // Don't dump ownership
                '--no-privileges',  // Don't dump privileges
                '-f', filePath,
            ], { env, timeout: 120000 }); // 2 min timeout
        } catch (error: any) {
            // Cleanup partial file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw new Error(`pg_dump failed: ${error.stderr || error.message}`);
        }

        const stats = fs.statSync(filePath);
        return {
            fileName,
            filePath,
            sizeBytes: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: stats.mtime.toISOString(),
        };
    }

    /**
     * Restore database from a backup file using pg_restore
     * WARNING: This will overwrite existing data!
     */
    static async restoreBackup(filePath: string): Promise<{ success: boolean; message: string }> {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Backup file not found: ${filePath}`);
        }

        const conn = parseDatabaseUrl();
        const env = {
            ...process.env,
            PGPASSWORD: conn.password,
        };

        try {
            await execFileAsync('pg_restore', [
                '-h', conn.host,
                '-p', conn.port,
                '-U', conn.user,
                '-d', conn.database,
                '--clean',          // Drop objects before creating
                '--if-exists',      // Don't error if objects don't exist
                '--no-owner',
                '--no-privileges',
                '--single-transaction', // All-or-nothing restore
                filePath,
            ], { env, timeout: 300000 }); // 5 min timeout

            return { success: true, message: 'Database restored successfully' };
        } catch (error: any) {
            // pg_restore returns exit code 1 for warnings (e.g. "table already exists")
            // which is often expected with --clean --if-exists
            const stderr = error.stderr || '';
            if (error.code === 1 && !stderr.includes('FATAL') && !stderr.includes('ERROR')) {
                return { success: true, message: 'Database restored with warnings (normal)' };
            }
            throw new Error(`pg_restore failed: ${stderr || error.message}`);
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
