
import { prisma } from './src/libs/prisma';

async function checkPrisma() {
    // Test explicit lowercase
    console.log('Explicit lowercase:', Object.keys(prisma).filter(k => k === 'machine' || k === 'user'));
    // Test explicit PascalCase
    console.log('Explicit PascalCase:', Object.keys(prisma).filter(k => k === 'Machine' || k === 'User'));

    // Try accessing directly
    console.log('prisma.machine exists?', typeof (prisma as any).machine);
    console.log('prisma.Machine exists?', typeof (prisma as any).Machine);
    console.log('prisma.user exists?', typeof (prisma as any).user);
    console.log('prisma.User exists?', typeof (prisma as any).User);

    // Try querying Machine if it exists
    try {
        const machines = await (prisma as any).machine.findMany();
        console.log('Query using "machine" works. Count:', machines.length);
    } catch (e: any) {
        console.log('Query using "machine" failed:', e?.message || e);
    }

    try {
        const machines = await (prisma as any).Machine.findMany();
        console.log('Query using "Machine" works. Count:', machines.length);
    } catch (e: any) {
        console.log('Query using "Machine" failed:', e?.message || e);
    }

    await prisma.$disconnect();
}

checkPrisma();
