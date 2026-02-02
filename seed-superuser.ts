/**
 * Seed Superuser Script
 * 
 * Jalankan dengan: npx ts-node seed-superuser.ts
 */

import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User } from './types/model/table/User';
import { UserRole } from './types/model/enum/UserRole';
import * as bcrypt from 'bcrypt';

const ROOT_EMAIL = 'root@pangan.com';
const ROOT_PASSWORD = 'root123';
const ROOT_FULLNAME = 'Super Administrator';

async function seedSuperuser() {
    try {
        console.log('🔌 Connecting to database...');
        await AppDataSource.initialize();
        console.log('✅ Database connected!');

        const userRepo = AppDataSource.getRepository(User);

        const existing = await userRepo.findOne({
            where: { email: ROOT_EMAIL }
        });

        if (existing) {
            console.log('⚠️  Superuser already exists! Updating...');
            existing.password_hash = await bcrypt.hash(ROOT_PASSWORD, 10);
            existing.role = UserRole.SUPERUSER;
            existing.is_active = true;
            await userRepo.save(existing);
            console.log('✅ Superuser updated!');
        } else {
            console.log('🔐 Creating superuser...');
            const passwordHash = await bcrypt.hash(ROOT_PASSWORD, 10);

            const superuser = userRepo.create({
                email: ROOT_EMAIL,
                password_hash: passwordHash,
                fullname: ROOT_FULLNAME,
                role: UserRole.SUPERUSER,
                is_active: true
            });

            await userRepo.save(superuser);
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

        await AppDataSource.destroy();
        console.log('');
        console.log('🔒 Database connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedSuperuser();
