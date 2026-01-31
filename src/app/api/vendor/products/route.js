import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
    try {
        const data = await req.json();
        const {
            name,
            description,
            sku,
            costPrice,
            salePrice,
            quantityOnHand,
            category, // We might store this in attributes or add a field if schema allows. Schema doesn't have category field on Product, only attributes Json? 
            // Wait, user asked for category previously. 
            // Looking at schema in Step 11, Product model does NOT have category. 
            // User model HAS category. 
            // I should assume category goes into `attributes` JSON or add it to schema.
            // For now, I'll put it in `attributes` to avoid schema migration overhead unless critical.
            // Actually, standardized category is important. I'll put it in attributes: { category: "..." }
            pricing,   // Array of { unit, duration, price }
            imageUrls
        } = data;

        // Basic validation
        if (!name || !sku || !pricing || pricing.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create Product with relation to PriceConfig
        const product = await prisma.product.create({
            data: {
                name,
                description,
                sku,
                costPrice: parseFloat(costPrice),
                salePrice: parseFloat(salePrice), // This might be base price or selling price if sold?
                quantityOnHand: parseInt(quantityOnHand),
                isRentable: true,
                isPublished: true,
                minRentalPeriod: 1, // Default
                maxRentalPeriod: 30, // Default
                imageUrls: imageUrls || [],
                attributes: { category },
                priceConfigs: {
                    create: pricing.map(p => ({
                        periodUnit: p.unit, // HOUR, DAY, WEEK
                        duration: parseInt(p.duration),
                        price: parseFloat(p.price),
                    }))
                }
            },
        });

        return NextResponse.json({ message: 'Product created successfully', product });
    } catch (error) {
        console.error('Create Product Error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'SKU must be unique' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const products = await prisma.product.findMany({
            include: {
                priceConfigs: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
