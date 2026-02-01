const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                order: true
            }
        });
        console.log('Total Payments:', payments.length);
        if (payments.length > 0) {
            console.log('Sample Payment:', JSON.stringify(payments[0], null, 2));
        }
    } catch (e) {
        console.error('Error fetching payments:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
