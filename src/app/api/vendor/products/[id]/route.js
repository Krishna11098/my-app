import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper: Delete from Cloudinary if needed (not implemented here but good practice)

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const data = await req.json();

        // Validate existence
        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const { name, description, quantityOnHand, costPrice, salePrice, isPublished, attributes, pricing, imageUrls } = data;

        // Update Product
        // Note: updating nested PriceConfigs is complex (delete/create or update).
        // Simple strategy: Delete all configs and recreate them.

        // Transaction
        const updatedProduct = await prisma.$transaction(async (tx) => {
            // 1. Update basic fields
            const product = await tx.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    quantityOnHand: parseInt(quantityOnHand),
                    costPrice: parseFloat(costPrice),
                    salePrice: parseFloat(salePrice),
                    isPublished,
                    attributes, // Json update
                    imageUrls
                }
            });

            // 2. Update Pricing
            if (pricing && pricing.length > 0) {
                // Delete old
                await tx.priceConfig.deleteMany({ where: { productId: id } });

                // Create new
                await tx.priceConfig.createMany({
                    data: pricing.map(p => ({
                        productId: id,
                        periodUnit: p.unit,
                        duration: parseInt(p.duration),
                        price: parseFloat(p.price)
                    }))
                });
            }

            return product;
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Update Product Error:", error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        // Soft delete is preferred in schema (deletedAt), but let's do hard delete or update deletedAt if schema supports it.
        // Schema has `deletedAt`.

        await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date(), isPublished: false }
        });

        return NextResponse.json({ message: 'Product deleted' });
    } catch (error) {
        console.error("Delete Product Error:", error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
