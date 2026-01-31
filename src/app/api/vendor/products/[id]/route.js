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

export async function GET(req, { params }) {
    try {
        const vendor = await getVendorFromToken();
        if (!vendor) {
            return NextResponse.json({ error: 'Unauthorized - Vendor only' }, { status: 401 });
        }

        const { id } = await params;
        
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                priceConfigs: true,
                vendor: {
                    select: { id: true, name: true, companyName: true }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Verify vendor owns this product
        if (product.vendorId && product.vendorId !== vendor.id) {
            return NextResponse.json({ error: 'Unauthorized - Not your product' }, { status: 403 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Get Product Error:", error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const vendor = await getVendorFromToken();
        if (!vendor) {
            return NextResponse.json({ error: 'Unauthorized - Vendor only' }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();

        // Validate existence and ownership
        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        
        // Verify vendor owns this product
        if (existing.vendorId && existing.vendorId !== vendor.id) {
            return NextResponse.json({ error: 'Unauthorized - Not your product' }, { status: 403 });
        }

        const { 
            name, 
            description, 
            productType,
            priceUnit,
            category,
            quantityOnHand, 
            costPrice, 
            salePrice, 
            isPublished, 
            attributes, 
            pricing, 
            imageUrls,
            minRentalPeriod,
            maxRentalPeriod
        } = data;

        // Transaction
        const updatedProduct = await prisma.$transaction(async (tx) => {
            // 1. Update basic fields
            const product = await tx.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    productType: productType || undefined,
                    priceUnit: priceUnit || undefined,
                    category: category || undefined,
                    quantityOnHand: quantityOnHand !== undefined ? parseInt(quantityOnHand) : undefined,
                    costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
                    salePrice: salePrice !== undefined ? parseFloat(salePrice) : undefined,
                    isPublished: isPublished !== undefined ? isPublished : undefined,
                    attributes: attributes || undefined,
                    imageUrls: imageUrls || undefined,
                    minRentalPeriod: minRentalPeriod !== undefined ? parseInt(minRentalPeriod) : undefined,
                    maxRentalPeriod: maxRentalPeriod !== undefined ? parseInt(maxRentalPeriod) : undefined,
                }
            });

            // 2. Update Pricing if provided
            if (pricing && pricing.length > 0) {
                await tx.priceConfig.deleteMany({ where: { productId: id } });
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

        // Fetch complete product with price configs
        const fullProduct = await prisma.product.findUnique({
            where: { id },
            include: { priceConfigs: true }
        });

        return NextResponse.json(fullProduct);
    } catch (error) {
        console.error("Update Product Error:", error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const vendor = await getVendorFromToken();
        if (!vendor) {
            return NextResponse.json({ error: 'Unauthorized - Vendor only' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        
        if (existing.vendorId && existing.vendorId !== vendor.id) {
            return NextResponse.json({ error: 'Unauthorized - Not your product' }, { status: 403 });
        }

        // Soft delete
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
