
import { T_seedSuperuser } from "../types/api/T_seedSuperuser";
import { User_role_enum } from "@prisma/client";
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { userRepository } from "../src/repositories/user.repository";
import { requireAuth } from "../utility/auth";
import { ForbiddenError } from "../src/utils/errors";
import { apiWrapper } from "../src/utils/apiWrapper";

const SEED_SECRET = process.env.SEED_SECRET;
const ROOT_EMAIL = 'root@pangan.com';

export const t_seedSuperuser: T_seedSuperuser = apiWrapper(async (req, res) => {
    // 0. Disable in production
    if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenError('This endpoint is disabled in production');
    }

    if (!SEED_SECRET) {
        throw new Error('SEED_SECRET environment variable is required');
    }

    // 1. Require ADMIN authentication
    await requireAuth(req, 'ADMIN');

    // 2. Verify Secret Key
    if (req.body.secretKey !== SEED_SECRET) {
        return {
            success: false,
            message: 'Invalid secret key'
        };
    }

    // Use password from request body, or generate a random one
    const password = req.body.password || crypto.randomBytes(16).toString('hex');

    // 2. Check if Superuser exists
    const existing = await userRepository.findByEmail(ROOT_EMAIL);

    if (existing) {
        // Update existing user to be SUPERUSER with correct password
        const passwordHash = await bcrypt.hash(password, 10);
        await userRepository.update(existing.id, {
            password_hash: passwordHash,
            role: User_role_enum.SUPERUSER,
            is_active: true
        });

        return {
            success: true,
            message: `Superuser ${ROOT_EMAIL} privileges restored & password reset.`
        };
    }

    // 3. Create new Superuser
    const passwordHash = await bcrypt.hash(password, 10);

    await userRepository.create({
        email: ROOT_EMAIL,
        password_hash: passwordHash,
        fullname: 'Super Administrator',
        role: User_role_enum.SUPERUSER,
        is_active: true
    });

    return {
        success: true,
        message: `Superuser ${ROOT_EMAIL} created successfully!`
    };
});
