import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const order = await prisma.rentalOrder.findUnique({
            where: { id },
            include: {
                lines: {
                    include: { product: true }
                },
                customer: {
                    select: { id: true, name: true, email: true, companyName: true, gstin: true }
                },
                invoice: {
                    include: { payments: true }
                },
                pickup: {
                    include: { items: true }
                },
                return: {
                    include: { items: true }
                },
                reservations: true,
                pickupAddress: true,
                returnAddress: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Get Order Error:', error);
        return NextResponse.json({ error: 'Error fetching order' }, { status: 500 });
    }
}
