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
        const products = await prisma.product.findMany({
            where: { deletedAt: null },
            include: {
                vendor: {
                    select: { id: true, name: true, companyName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Admin Products Error:', error);
        return NextResponse.json({ error: 'Failed to fetch global catalog' }, { status: 500 });
    }
}

export async function PATCH(req) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, isPublished } = await req.json();

        const updated = await prisma.product.update({
            where: { id },
            data: { isPublished }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update product error:', error);
        return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
    }
}

export async function DELETE(req) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await prisma.product.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isPublished: false
            }
        });

        return NextResponse.json({ success: true, message: 'Resource terminated' });
    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json({ error: 'Failed to terminate resource' }, { status: 500 });
    }
}
