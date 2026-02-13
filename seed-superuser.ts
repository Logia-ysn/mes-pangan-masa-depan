/**
 * Seed Superuser Script (Prisma Version)
 * 
 * Jalankan dengan: npx ts-node seed-superuser.ts
 */

import { prisma } from './src/libs/prisma';
import { User_role_enum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ROOT_EMAIL = 'root@pangan.com';
const ROOT_PASSWORD = 'root123';
const ROOT_FULLNAME = 'Super Administrator';

async function seedSuperuser() {
    try {
        console.log('🔌 Connecting to database via Prisma...');

        const existing = await prisma.user.findFirst({
            where: { email: ROOT_EMAIL }
        });

        const passwordHash = await bcrypt.hash(ROOT_PASSWORD, 10);

        if (existing) {
            console.log('⚠️  Superuser already exists! Updating...');
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    password_hash: passwordHash,
                    role: User_role_enum.SUPERUSER,
                    is_active: true
                }
            });
            console.log('✅ Superuser updated!');
        } else {
            console.log('🔐 Creating superuser...');
            await prisma.user.create({
                data: {
                    email: ROOT_EMAIL,
                    password_hash: passwordHash,
                    fullname: ROOT_FULLNAME,
                    role: User_role_enum.SUPERUSER,
                    is_active: true
                }
            });
            console.log('✅ Superuser created!');
        }

        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('   SUPERUSER ACCOUNT                       ');
        console.log('═══════════════════════════════════════════');
        console.log('   📧 Email    : root@pangan.com');
        console.log('   🔑 Password : root123');
        console.log('   👤 Role     : SUPERUSER');
        console.log('═══════════════════════════════════════════');

        await prisma.$disconnect();
        console.log('');
        console.log('🔒 Database connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedSuperuser();
