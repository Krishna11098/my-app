import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

        const invoices = await prisma.invoice.findMany({
            where: {
                vendorId: vendor.id
            },
            include: {
                customer: {
                    select: { name: true, email: true }
                },
                order: {
                    select: { orderNumber: true }
                }
            },
            orderBy: { issueDate: 'desc' }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Invoice Fetch Error:", error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}
