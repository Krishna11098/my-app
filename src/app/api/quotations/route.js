import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Create a new Quotation
export async function POST(req) {
    try {
        const { userId, items, startDate, endDate, subtotal, tax, total } = await req.json(); // items = [{ productId, quantity, price }]

        if (!userId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Generate Quotation Number
        const count = await prisma.quotation.count();
        // Check Availability (Prevent Overbooking)
        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { quantityOnHand: true, name: true }
            });

            if (!product) continue;

            // Find overlapping reservations
            const start = new Date(startDate);
            const end = new Date(endDate);

            const conflictingReservations = await prisma.reservation.findMany({
                where: {
                    productId: item.productId,
                    fromDate: { lte: end },
                    toDate: { gte: start }
                }
            });

            const reservedQty = conflictingReservations.reduce((acc, res) => acc + res.quantity, 0);

            if (reservedQty + item.quantity > product.quantityOnHand) {
                return NextResponse.json({
                    error: `Product '${product.name}' is unavailable for the selected dates. (Available: ${product.quantityOnHand - reservedQty})`
                }, { status: 400 });
            }
        }

        const quotationNumber = `QT-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const quotation = await prisma.quotation.create({
            data: {
                customerId: userId,
                quotationNumber,
                status: 'DRAFT',
                subtotal,
                taxAmount: tax,
                totalAmount: total,
                rentalStart: new Date(startDate),
                rentalEnd: new Date(endDate),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days expiry
                lines: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        lineTotal: item.lineTotal // unitPrice * quantity * days
                    }))
                }
            },
        });

        return NextResponse.json({ message: 'Quotation created', quotation });
    } catch (error) {
        console.error('Create Quotation Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
