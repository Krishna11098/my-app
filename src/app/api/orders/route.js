import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json([], { status: 400 });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return NextResponse.json([], { status: 404 });

        // Fetch Quotations (Customers see these)
        const quotations = await prisma.quotation.findMany({
            where: { customerId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                lines: { include: { product: true } },
                order: true // Include linked confirmed order
            }
        });

        // Map to a friendlier structure if needed, or just return.
        // If order exists, use order status.
        const orders = quotations.map(q => ({
            id: q.order ? q.order.id : q.id,
            isOrder: !!q.order,
            referenceNumber: q.order ? q.order.orderNumber : q.quotationNumber,
            status: q.order ? q.order.status : q.status,
            totalAmount: q.totalAmount,
            rentalStart: q.rentalStart,
            rentalEnd: q.rentalEnd,
            items: q.lines.map(l => ({ name: l.product.name, qty: l.quantity })),
            rawStatus: q.status // Keep original
        }));

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
