/**
 * Seed Admin User Script (Prisma Version)
 * 
 * Jalankan dengan: npx ts-node seed-admin.ts
 */

import { prisma } from './src/libs/prisma';
import { User_role_enum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@pangan.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_FULLNAME = 'Administrator';

async function seedAdmin() {
    try {
        console.log('🔌 Connecting to database via Prisma...');

        const existingAdmin = await prisma.user.findFirst({
            where: { email: ADMIN_EMAIL }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log(`   Email: ${ADMIN_EMAIL}`);
            console.log('   Skipping creation...');
        } else {
            console.log('🔐 Hashing password...');
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

            await prisma.user.create({
                data: {
                    email: ADMIN_EMAIL,
                    password_hash: passwordHash,
                    fullname: ADMIN_FULLNAME,
                    role: User_role_enum.ADMIN,
                    is_active: true
                }
            });

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

        await prisma.$disconnect();
        console.log('');
        console.log('🔒 Database connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
