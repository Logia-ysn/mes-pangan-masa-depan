import { apiWrapper } from '../src/utils/apiWrapper';
import { requireAuth, sanitizeUser } from '../utility/auth';
import { userService } from '../src/services/user.service';
import { T_createUserByAdmin } from '../types/api/T_createUserByAdmin';

export const t_createUserByAdmin: T_createUserByAdmin = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');

    const { email, password, fullname, role, id_factory } = req.body;

    if (!email || !password || !fullname) {
        throw new Error('Email, password, dan fullname wajib diisi');
    }

    const user = await userService.createUser({
        email,
        password,
        fullname,
        role: role || 'OPERATOR',
        id_factory,
    });

    return sanitizeUser(user);
});
