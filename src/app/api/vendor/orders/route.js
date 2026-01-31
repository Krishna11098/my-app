import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        // Fetch Confirmed Orders (RentalOrder)
        const rentalOrders = await prisma.rentalOrder.findMany({
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });

        // Optionally Fetch Pending Quotations if you want Vendor to see Drafts?
        // Usually Vendor only cares about Confirmed or "Sent" quotations.
        // Let's stick to RentalOrders for the "Orders" tab. 
        // Or if we want to see "Requests to approve", we check Quotations with status 'SENT'.
        // Current flow: Customer confirms -> 'CONFIRMED' Order is created.

        return NextResponse.json(rentalOrders);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { id, status } = await req.json(); // id is Order ID

        // Update Order Status
        const updatedOrder = await prisma.rentalOrder.update({
            where: { id },
            data: { status }
        });

        // Handle Status Transitions
        if (status === 'RETURNED') {
            // Logic: Release Stock (Update Reservation)
            // If returned early, we free up the calendar.
            // Find reservations for this order
            const reservations = await prisma.reservation.findMany({ where: { orderId: id } });

            const now = new Date();

            // Update toDates to NOW if currently in future (Early Return)
            // Or just logging return.

            for (const res of reservations) {
                if (new Date(res.toDate) > now) {
                    await prisma.reservation.update({
                        where: { id: res.id },
                        data: { toDate: now }
                    });
                }
            }

            // Also update Return entity if exists or create one (as per schema requirement "Return document generated")
            // Check if return doc exists
            const existingReturn = await prisma.return.findUnique({ where: { orderId: id } });
            if (!existingReturn) {
                const count = await prisma.return.count();
                await prisma.return.create({
                    data: {
                        orderId: id,
                        returnNumber: `RET-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`,
                        returnDate: now,
                        status: 'COMPLETED',
                        // items logic omitted for MVP brevity, should copy order items
                    }
                });
            }
        }

        if (status === 'PICKED_UP') {
            // Create Pickup document
            const existingPickup = await prisma.pickup.findUnique({ where: { orderId: id } });
            if (!existingPickup) {
                const count = await prisma.pickup.count();
                await prisma.pickup.create({
                    data: {
                        orderId: id,
                        pickupNumber: `PKP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`,
                        pickupDate: new Date(),
                        status: 'COMPLETED'
                    }
                });
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Order Update Error:", error);
        return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
    }
}
