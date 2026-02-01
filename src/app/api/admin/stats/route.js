import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getAdminFromToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true }
        });
        if (!user || user.role !== 'ADMIN') return null;
        return user;
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const admin = await getAdminFromToken();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Core Analytics
        const totalRevenue = await prisma.rentalOrder.aggregate({
            _sum: { totalAmount: true },
            where: { status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] } }
        });

        const activeVendors = await prisma.user.count({
            where: { role: 'VENDOR' }
        });

        const totalOrders = await prisma.rentalOrder.count();

        const totalProducts = await prisma.product.count({
            where: { deletedAt: null }
        });

        // 2. Recent Global Activity
        const recentOrders = await prisma.rentalOrder.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { name: true, email: true, phone: true } },
                vendor: { select: { name: true, companyName: true, email: true } },
                lines: { include: { product: { select: { name: true } } } }
            }
        });

        // 3. Vendor Performance Snapshot
        const vendorStats = await prisma.user.findMany({
            where: { role: 'VENDOR' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                companyName: true,
                gstin: true,
                _count: {
                    select: { vendorOrders: true, products: true }
                }
            },
            take: 5
        });

        // 4. Most Rented Products
        try {
            const mostRentedProducts = await prisma.orderLine.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5
            });

            const topProducts = await Promise.all(
                mostRentedProducts.map(async (item) => {
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId },
                        select: { name: true }
                    });
                    return {
                        name: product?.name || 'Unknown Product',
                        count: item._sum.quantity
                    };
                })
            );

            return NextResponse.json({
                stats: {
                    revenue: Number(totalRevenue._sum.totalAmount || 0),
                    vendors: activeVendors,
                    orders: totalOrders,
                    products: totalProducts
                },
                recentOrders,
                topVendors: vendorStats.map(v => ({
                    id: v.id,
                    name: v.name,
                    email: v.email,
                    phone: v.phone,
                    companyName: v.companyName,
                    gstin: v.gstin,
                    ordersCount: v._count.vendorOrders,
                    productsCount: v._count.products
                })),
                topProducts
            });
        } catch (innerError) {
            console.error('Trend Analysis Failure:', innerError);
            // Return stats even if top products fails
            return NextResponse.json({
                stats: {
                    revenue: Number(totalRevenue._sum.totalAmount || 0),
                    vendors: activeVendors,
                    orders: totalOrders,
                    products: totalProducts
                },
                recentOrders,
                topVendors: vendorStats.map(v => ({
                    id: v.id,
                    name: v.name,
                    ordersCount: v._count.vendorOrders
                })),
                topProducts: []
            });
        }

    } catch (error) {
        console.error('PLATFORM_CORE_CRITICAL:', error);
        return NextResponse.json({
            error: 'Failed to fetch global stats',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
