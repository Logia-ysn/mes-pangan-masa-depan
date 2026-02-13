import { apiWrapper } from '../src/utils/apiWrapper';
import { requireAuth, hashPassword } from '../utility/auth';
import { userRepository } from '../src/repositories/user.repository';

export const t_resetUserPassword = apiWrapper(async (req: any, res: any) => {
    await requireAuth(req, 'ADMIN');

    const id = Number(req.path?.id || req.params?.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const hashedPassword = await hashPassword(new_password);
    const success = await userRepository.updatePassword(id, hashedPassword);

    if (!success) {
        return res.status(500).json({ error: 'Gagal mereset password' });
    }

    res.json({ success: true, message: 'Password berhasil direset' });
});
