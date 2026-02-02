/**
 * Seed Admin User Script
 * 
 * Jalankan dengan: npx ts-node seed-admin.ts
 * 
 * Akan membuat user admin:
 * - Email: admin@pangan.com
 * - Password: admin123
 */

import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User } from './types/model/table/User';
import { UserRole } from './types/model/enum/UserRole';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@pangan.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_FULLNAME = 'Administrator';

async function seedAdmin() {
    try {
        // Initialize database connection
        console.log('🔌 Connecting to database...');
        await AppDataSource.initialize();
        console.log('✅ Database connected!');

        const userRepo = AppDataSource.getRepository(User);

        // Check if admin already exists
        const existingAdmin = await userRepo.findOne({
            where: { email: ADMIN_EMAIL }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log(`   Email: ${ADMIN_EMAIL}`);
            console.log('   Skipping creation...');
        } else {
            // Hash password
            console.log('🔐 Hashing password...');
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

            // Create admin user
            const admin = userRepo.create({
                email: ADMIN_EMAIL,
                password_hash: passwordHash,
                fullname: ADMIN_FULLNAME,
                role: UserRole.ADMIN,
                is_active: true
            });

            await userRepo.save(admin);

            console.log('');
            console.log('═══════════════════════════════════════════');
            console.log('✅ ADMIN USER CREATED SUCCESSFULLY!');
            console.log('═══════════════════════════════════════════');
            console.log('');
            console.log('   📧 Email    : admin@pangan.com');
            console.log('   🔑 Password : admin123');
            console.log('   👤 Role     : ADMIN');
            console.log('');
            console.log('═══════════════════════════════════════════');
        }

        // Close connection
        await AppDataSource.destroy();
        console.log('');
        console.log('🔒 Database connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
