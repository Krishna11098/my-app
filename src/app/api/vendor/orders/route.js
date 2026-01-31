import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper to get vendor from token
async function getVendorFromToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true }
        });
        if (!user || user.role !== 'VENDOR') return null;
        return user;
    } catch {
        return null;
    }
}

export async function GET(req) {
    try {
        const vendor = await getVendorFromToken();
        if (!vendor) {
            return NextResponse.json({ error: 'Unauthorized - Vendor only' }, { status: 401 });
        }

        // Fetch Orders belonging to this vendor
        // Orders are linked to vendor through vendorId field
        const rentalOrders = await prisma.rentalOrder.findMany({
            where: {
                vendorId: vendor.id  // Only vendor's orders
            },
            include: { 
                customer: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                lines: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrls: true }
                        }
                    }
                },
                pickup: true,
                return: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rentalOrders);
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const vendor = await getVendorFromToken();
        if (!vendor) {
            return NextResponse.json({ error: 'Unauthorized - Vendor only' }, { status: 401 });
        }

        const { id, status } = await req.json();

        // Verify vendor owns this order
        const existingOrder = await prisma.rentalOrder.findUnique({ where: { id } });
        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        if (existingOrder.vendorId && existingOrder.vendorId !== vendor.id) {
            return NextResponse.json({ error: 'Unauthorized - Not your order' }, { status: 403 });
        }

        // Update Order Status
        const updatedOrder = await prisma.rentalOrder.update({
            where: { id },
            data: { status }
        });

        // Handle Status Transitions
        if (status === 'RETURNED') {
            const reservations = await prisma.reservation.findMany({ where: { orderId: id } });
            const now = new Date();

            for (const res of reservations) {
                if (new Date(res.toDate) > now) {
                    await prisma.reservation.update({
                        where: { id: res.id },
                        data: { toDate: now }
                    });
                }
            }

            const existingReturn = await prisma.return.findUnique({ where: { orderId: id } });
            if (!existingReturn) {
                const count = await prisma.return.count();
                await prisma.return.create({
                    data: {
                        orderId: id,
                        returnNumber: `RET-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`,
                        returnDate: now,
                        status: 'COMPLETED',
                    }
                });
            }
        }

        if (status === 'PICKED_UP') {
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
