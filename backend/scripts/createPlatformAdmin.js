const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

const DEFAULT_PHONE = '9999999999';
const DEFAULT_PASSWORD = 'Admin@123';
const DEFAULT_NAME = 'BookCircle SaaS Admin';

async function main() {
    const phone = (process.env.ADMIN_PHONE || DEFAULT_PHONE).trim();
    const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
    const name = (process.env.ADMIN_NAME || DEFAULT_NAME).trim();

    if (!phone || !password || !name) {
        throw new Error('ADMIN_PHONE, ADMIN_PASSWORD, and ADMIN_NAME must be non-empty.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { phone },
        update: {
            name,
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            societyId: null
        },
        create: {
            name,
            phone,
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE'
        },
        select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            status: true
        }
    });

    console.log('Platform admin ready');
    console.log(JSON.stringify(admin, null, 2));
    console.log(`Login phone: ${phone}`);
    console.log(`Login password: ${password}`);
}

main()
    .catch((error) => {
        console.error('Failed to create platform admin:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
