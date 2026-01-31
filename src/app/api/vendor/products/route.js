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
        // Verify user is a vendor
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, category: true, customCategory: true }
        });
        if (!user || user.role !== 'VENDOR') return null;
        return user;
    } catch {
        return null;
    }
}

export async function POST(req) {
    try {
        const vendor = await getVendorFromToken();
        if (!vendor) {
            return NextResponse.json({ error: 'Unauthorized - Vendor only' }, { status: 401 });
        }

        const data = await req.json();
        const {
            name,
            description,
            sku,
            productType,  // GOODS or SERVICE
            priceUnit,    // PER_HOUR, PER_DAY, etc.
            category,
            costPrice,
            salePrice,
            quantityOnHand,
            pricing,   // Array of { unit, duration, price }
            imageUrls,
            attributes,  // Additional attributes like brand, color
            minRentalPeriod,
            maxRentalPeriod,
            isPublished
        } = data;

        // Basic validation
        if (!name || !sku || !pricing || pricing.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Use vendor's category (from signup) - if "Other", use customCategory
        const productCategory = vendor.category === 'Other' 
            ? vendor.customCategory 
            : vendor.category;

        // Create Product with vendorId
        const product = await prisma.product.create({
            data: {
                vendorId: vendor.id,
                name,
                description,
                sku,
                productType: productType || 'GOODS',
                priceUnit: priceUnit || 'PER_DAY',
                category: productCategory || null,
                costPrice: parseFloat(costPrice),
                salePrice: parseFloat(salePrice),
                quantityOnHand: parseInt(quantityOnHand),
                isRentable: true,
                isPublished: isPublished !== false, // Default true
                minRentalPeriod: parseInt(minRentalPeriod) || 1,
                maxRentalPeriod: parseInt(maxRentalPeriod) || 720,
                imageUrls: imageUrls || [],
                attributes: attributes || {},
                priceConfigs: {
                    create: pricing.map(p => ({
                        periodUnit: p.unit,
                        duration: parseInt(p.duration),
                        price: parseFloat(p.price),
                    }))
                }
            },
            include: {
                priceConfigs: true
            }
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
        const vendor = await getVendorFromToken();
        if (!vendor) {
            return NextResponse.json({ error: 'Unauthorized - Vendor only' }, { status: 401 });
        }

        // Only fetch products belonging to this vendor
        const products = await prisma.product.findMany({
            where: {
                vendorId: vendor.id,
                deletedAt: null  // Exclude soft-deleted
            },
            include: {
                priceConfigs: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error('Fetch Products Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
