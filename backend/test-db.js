const prisma = require('./prismaClient');

async function main() {
    try {
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Database connection successful');
        console.log('Users found:', users.length);
    } catch (err) {
        console.error('Database connection failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
