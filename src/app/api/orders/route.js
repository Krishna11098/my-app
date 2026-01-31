import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json([], { status: 400 });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return NextResponse.json([], { status: 404 });

        // Fetch Quotations
        const quotations = await prisma.quotation.findMany({
            where: { customerId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                lines: { include: { product: true } },
                orders: {
                    include: { lines: { include: { product: true } } }
                }
            }
        });

        // Map to flat list of orders/quotations
        const orders = quotations.flatMap(q => {
            if (q.orders && q.orders.length > 0) {
                return q.orders.map(o => ({
                    id: o.id,
                    isOrder: true,
                    referenceNumber: o.orderNumber,
                    status: o.status,
                    totalAmount: o.totalAmount,
                    rentalStart: o.rentalStart,
                    rentalEnd: o.rentalEnd,
                    items: o.lines.map(l => ({ name: l.product?.name || 'Item', qty: l.quantity })),
                    rawStatus: q.status
                }));
            }
            return [{
                id: q.id,
                isOrder: false,
                referenceNumber: q.quotationNumber,
                status: q.status,
                totalAmount: q.totalAmount,
                rentalStart: q.rentalStart,
                rentalEnd: q.rentalEnd,
                items: q.lines.map(l => ({ name: l.product?.name || 'Item', qty: l.quantity })),
                rawStatus: q.status
            }];
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("DEBUG: Orders API Error:", error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
