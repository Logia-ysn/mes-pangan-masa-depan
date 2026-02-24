const { PrismaClient } = require('@prisma/client');
const { hashSync } = require('bcryptjs');

const p = new PrismaClient();

async function main() {
    const hash = hashSync('Admin1234!', 10);
    const user = await p.user.update({
        where: { email: 'root@pangan.com' },
        data: { password_hash: hash }
    });
    console.log('Password reset for:', user.email, '| New password: Admin1234!');
    await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
