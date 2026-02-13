import { apiWrapper } from '../src/utils/apiWrapper';
import { requireAuth, hashPassword } from '../utility/auth';
import { userRepository } from '../src/repositories/user.repository';
import { T_resetUserPassword } from '../types/api/T_resetUserPassword';

export const t_resetUserPassword: T_resetUserPassword = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');

    const id = Number(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
        throw new Error('Password minimal 6 karakter');
    }

    const hashedPassword = await hashPassword(new_password);
    const success = await userRepository.updatePassword(id, hashedPassword);

    if (!success) {
        throw new Error('Gagal mereset password');
    }

    return { success: true, message: 'Password berhasil direset' };
});
