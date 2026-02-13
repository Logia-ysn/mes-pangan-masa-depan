# Restore Point - v2.3.0 (Mobile Ready)
**Date**: Feb 13, 2026 - 21:35
**Status**: Stable & Mobile Responsive

## Backup Location
- Source Code: `backups/full_v2.3.0_mobile_ready_20260213_213507/source_code.tar.gz`
- Database: (Manual backup failed because Docker was offline. Prisma schema used as reference)

## How to Restore
1. Extract `source_code.tar.gz` to the project root.
2. Run `npm install` in root and `frontend` folder.
3. Run `npx prisma migrate deploy` to sync database schema.

## Key Changes in this Version
- Full Mobile Responsiveness (Invoices, Customers, Worksheets, Stocks, PO, Machines, etc)
- Version 2.3.0 stable in Vercel & Railway.
