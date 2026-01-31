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

export async function GET(req) {
    try {
        const vendor = await getVendorFromToken();
        if (!vendor) {
            return NextResponse.json({ error: 'Unauthorized - Vendor only' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startParam = searchParams.get('startDate');
        const endParam = searchParams.get('endDate');

        // Construct Date Filter
        let dateFilter = {};
        let trendStart = new Date();
        trendStart.setDate(trendStart.getDate() - 7); // Default 7 days ago
        let trendEnd = new Date();

        if (startParam && endParam) {
            const startDate = new Date(startParam);
            const endDate = new Date(endParam);
            endDate.setHours(23, 59, 59, 999);

            dateFilter = {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            };
            trendStart = startDate;
            trendEnd = endDate;
        }

        const vendorFilter = { vendorId: vendor.id };

        // 1. Total Revenue (Filtered by Vendor)
        const revenueAgg = await prisma.rentalOrder.aggregate({
            _sum: { totalAmount: true },
            where: {
                ...vendorFilter,
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                ...dateFilter
            }
        });
        const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);

        // 2. Orders Processed (Filtered by Vendor)
        const ordersProcessed = await prisma.rentalOrder.count({
            where: {
                ...vendorFilter,
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                ...dateFilter
            }
        });

        // 3. Pending Orders (Quotations involving vendor's products)
        // This is a bit more complex. Let's find distinct quotations that have lines for this vendor's products.
        const pendingQuotationsCount = await prisma.quotation.count({
            where: {
                status: 'DRAFT',
                ...dateFilter,
                lines: {
                    some: {
                        product: {
                            vendorId: vendor.id
                        }
                    }
                }
            }
        });

        // 4. Active Rents (Filtered by Vendor)
        const activeRents = await prisma.rentalOrder.count({
            where: {
                ...vendorFilter,
                status: 'CONFIRMED',
                rentalEnd: { gte: new Date() }
            }
        });

        // 5. Total Products (Filtered by Vendor)
        const totalProducts = await prisma.product.count({
            where: {
                vendorId: vendor.id,
                isPublished: true,
                deletedAt: null
            }
        });

        // 6. Revenue Trends (Filtered by Vendor)
        const trendOrders = await prisma.rentalOrder.findMany({
            where: {
                ...vendorFilter,
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                createdAt: {
                    gte: trendStart,
                    lte: trendEnd
                }
            },
            select: { totalAmount: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        const trendsMap = new Map();
        const diffTime = Math.abs(trendEnd - trendStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 60) {
            for (let i = 0; i <= diffDays; i++) {
                const d = new Date(trendStart);
                d.setDate(d.getDate() + i);
                const key = d.toISOString().split('T')[0];
                if (d <= trendEnd) trendsMap.set(key, 0);
            }
        }

        trendOrders.forEach(order => {
            const key = order.createdAt.toISOString().split('T')[0];
            const current = trendsMap.get(key) || 0;
            trendsMap.set(key, current + Number(order.totalAmount));
        });

        const trends = Array.from(trendsMap.values());

        // 7. Top Rented Products (Filtered by Vendor)
        const topProductsAgg = await prisma.orderLine.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: {
                order: {
                    ...vendorFilter,
                    status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                    ...dateFilter
                }
            },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 3
        });

        const topProducts = await Promise.all(topProductsAgg.map(async (item) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true }
            });
            return {
                name: product?.name || 'Unknown Product',
                count: item._sum.quantity || 0
            };
        }));

        const totalTopRents = topProducts.reduce((sum, p) => sum + p.count, 0) || 1;
        const topProductsWithStats = topProducts.map(p => ({
            ...p,
            percent: Math.round((p.count / totalTopRents) * 100) + '%'
        }));

        return NextResponse.json({
            revenue: totalRevenue,
            ordersProcessed,
            avgOrderValue: ordersProcessed > 0 ? totalRevenue / ordersProcessed : 0,
            activeRents,
            totalProducts,
            pendingOrders: pendingQuotationsCount,
            trends,
            topProducts: topProductsWithStats
        });

    } catch (error) {
        console.error("Stats Error:", error);
        return NextResponse.json({ error: 'Stats error' }, { status: 500 });
    }
}
