import { apiWrapper } from '../src/utils/apiWrapper';
import { requireAuth, sanitizeUser } from '../utility/auth';
import { userService } from '../src/services/user.service';

export const t_createUserByAdmin = apiWrapper(async (req: any, res: any) => {
    await requireAuth(req, 'ADMIN');

    const { email, password, fullname, role, id_factory } = req.body;

    if (!email || !password || !fullname) {
        return res.status(400).json({ error: 'Email, password, dan fullname wajib diisi' });
    }

    const user = await userService.createUser({
        email,
        password,
        fullname,
        role: role || 'OPERATOR',
        id_factory,
    });

    res.status(201).json(sanitizeUser(user));
});
