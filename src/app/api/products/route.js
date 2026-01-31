import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        const products = await prisma.product.findMany({
            where: {
                isPublished: true,
            },
            include: {
                priceConfigs: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error('Fetch Public Products Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
