import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return false;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true }
        });
        return user?.role === 'ADMIN';
    } catch {
        return false;
    }
}

export async function GET() {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const vendors = await prisma.user.findMany({
            where: { role: 'VENDOR' },
            select: {
                id: true,
                name: true,
                email: true,
                companyName: true,
                gstin: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: { products: true, vendorOrders: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(vendors);
    } catch (error) {
        console.error('Fetch vendors error:', error);
        return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }
}

export async function PATCH(req) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, isVerified } = await req.json();

        const updated = await prisma.user.update({
            where: { id },
            data: { isVerified }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update vendor error:', error);
        return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
    }
}
