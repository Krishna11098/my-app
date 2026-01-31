const { PrismaClient } = require('@prisma/client');

try {
    console.log('Initializing PrismaClient...');
    const prisma = new PrismaClient({
        log: ['info'],
    });
    console.log('PrismaClient initialized successfully.');

    prisma.$connect()
        .then(() => {
            console.log('Successfully connected to the database.');
            return prisma.user.findMany({ take: 1 });
        })
        .then((users) => {
            console.log('Query successful. Users found:', users.length);
            return prisma.$disconnect();
        })
        .catch((e) => {
            console.error('Connection or query failed:', e);
            prisma.$disconnect();
            process.exit(1);
        });

} catch (e) {
    console.error('Initialization failed:', e);
    process.exit(1);
}
