
import { T_seedSuperuser } from "../types/api/T_seedSuperuser";
import { AppDataSource } from "../data-source";
import { User } from "../types/model/table/User";
import { UserRole } from "../types/model/enum/UserRole";
import * as bcrypt from 'bcrypt';

const SEED_SECRET = process.env.SEED_SECRET || 'P4ng4nM4s4D3p4nJ4y4!';
const ROOT_EMAIL = 'root@pangan.com';
const ROOT_PASSWORD = 'root123';

export const t_seedSuperuser: T_seedSuperuser = async (req) => {
    // 1. Verify Secret Key
    if (req.body.secretKey !== SEED_SECRET) {
        return {
            success: false,
            message: 'Invalid secret key'
        };
    }

    try {
        const userRepo = AppDataSource.getRepository(User);

        // 2. Check if Superuser exists
        const existing = await userRepo.findOne({
            where: { email: ROOT_EMAIL }
        });

        if (existing) {
            // Update existing user to be SUPERUSER with correct password
            existing.password_hash = await bcrypt.hash(ROOT_PASSWORD, 10);
            (existing as any).role = UserRole.SUPERUSER;
            existing.is_active = true;
            await userRepo.save(existing);

            return {
                success: true,
                message: `Superuser ${ROOT_EMAIL} privileges restored & password reset.`
            };
        }

        // 3. Create new Superuser
        const passwordHash = await bcrypt.hash(ROOT_PASSWORD, 10);

        const superuser = userRepo.create({
            email: ROOT_EMAIL,
            password_hash: passwordHash,
            fullname: 'Super Administrator',
            role: UserRole.SUPERUSER as any,
            is_active: true
        });

        await userRepo.save(superuser);

        return {
            success: true,
            message: `Superuser ${ROOT_EMAIL} created successfully!`
        };

    } catch (error: any) {
        console.error('Error seeding superuser:', error);
        return {
            success: false,
            message: error.message || 'Internal server error'
        };
    }
}
