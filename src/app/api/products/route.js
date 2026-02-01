import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');

        // Build Filter
        let where = { isPublished: true };

        if (category && category !== 'All') {
            where.category = {
                equals: category,
                mode: 'insensitive'
            };
        }

        if (minPrice || maxPrice) {
            where.salePrice = {};
            if (minPrice) where.salePrice.gte = parseFloat(minPrice);
            if (maxPrice) where.salePrice.lte = parseFloat(maxPrice);
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                priceConfigs: true
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Fetch Public Products Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
