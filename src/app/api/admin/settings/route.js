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
        const [systemConfigs, rentalPeriods, attributes] = await Promise.all([
            prisma.systemConfig.findMany(),
            prisma.rentalPeriodConfig.findMany(),
            prisma.attributeConfig.findMany()
        ]);

        return NextResponse.json({
            system: systemConfigs,
            periods: rentalPeriods,
            attributes: attributes
        });
    } catch (error) {
        console.error('Fetch settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { type, data } = await req.json();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        if (type === 'system') {
            const updated = await prisma.systemConfig.upsert({
                where: { key: data.key },
                update: {
                    value: data.value,
                    updatedBy: decoded.userId
                },
                create: {
                    key: data.key,
                    value: data.value,
                    category: data.category || 'GENERAL',
                    description: data.description,
                    updatedBy: decoded.userId
                }
            });
            return NextResponse.json(updated);
        }

        if (type === 'period') {
            const updated = await prisma.rentalPeriodConfig.upsert({
                where: { name: data.name },
                update: {
                    periodUnit: data.periodUnit,
                    duration: data.duration,
                    isActive: data.isActive
                },
                create: {
                    name: data.name,
                    periodUnit: data.periodUnit,
                    duration: data.duration,
                    isActive: data.isActive
                }
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'Invalid config type' }, { status: 400 });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }
}
