import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Get pickups for vendor
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const vendorId = searchParams.get('vendorId');

        if (!vendorId) {
            return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
        }

        const pickups = await prisma.pickup.findMany({
            where: {
                order: {
                    lines: {
                        some: {
                            product: { vendorId }
                        }
                    }
                }
            },
            include: {
                order: {
                    include: {
                        customer: { select: { name: true, email: true, companyName: true } },
                        lines: { include: { product: true } },
                        pickupAddress: true
                    }
                },
                items: { include: { product: true } }
            },
            orderBy: { pickupDate: 'asc' }
        });

        return NextResponse.json(pickups);
    } catch (error) {
        console.error('Get Pickups Error:', error);
        return NextResponse.json({ error: 'Error fetching pickups' }, { status: 500 });
    }
}

// PATCH: Update pickup status
export async function PATCH(req) {
    try {
        const { pickupId, status } = await req.json();

        const pickup = await prisma.pickup.update({
            where: { id: pickupId },
            data: { status },
            include: { order: true }
        });

        // If pickup completed, update order status
        if (status === 'COMPLETED') {
            await prisma.rentalOrder.update({
                where: { id: pickup.orderId },
                data: { status: 'PICKED_UP' }
            });
        }

        return NextResponse.json({ success: true, pickup });
    } catch (error) {
        console.error('Update Pickup Error:', error);
        return NextResponse.json({ error: 'Error updating pickup' }, { status: 500 });
    }
}
