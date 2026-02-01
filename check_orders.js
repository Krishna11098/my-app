const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const orders = await prisma.rentalOrder.findMany({
        select: { createdAt: true, totalAmount: true, orderNumber: true }
    });
    console.log('Total Orders:', orders.length);
    orders.forEach(o => {
        console.log(`Order: ${o.orderNumber}, Date: ${o.createdAt.toISOString()}, Amount: ${o.totalAmount}`);
    });
}

check();
