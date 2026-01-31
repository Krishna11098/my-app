import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
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
            // Set end date to end of day
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

        // 1. Total Revenue (Filtered)
        const revenueAgg = await prisma.rentalOrder.aggregate({
            _sum: { totalAmount: true },
            where: {
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                ...dateFilter
            }
        });
        const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);

        // 2. Orders Processed (Filtered)
        const ordersProcessed = await prisma.rentalOrder.count({
            where: {
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                ...dateFilter
            }
        });

        // 3. Pending Orders (Snapshot - usually current, but let's filter created in range if requested to see history of requests? 
        // Actually Pending meant "Current Actionable". Only filtering if user implies "Show me requests from last month". 
        // usage: standard is Current Pending. But for Reports page usage, filtering is expected.
        // I will filter Pending by creation date too.)
        const pendingOrders = await prisma.quotation.count({
            where: {
                status: 'DRAFT',
                ...dateFilter
            }
        });

        // 4. Active Rents (Snapshot - Current Active. Filtering by date range for "Historical Active" is complex intersection logic. Keeping CURRENT.)
        const activeRents = await prisma.rentalOrder.count({
            where: {
                status: 'CONFIRMED',
                rentalEnd: { gte: new Date() }
            }
        });

        // 5. Total Products (Snapshot)
        const totalProducts = await prisma.product.count({
            where: { isPublished: true }
        });

        // 6. Revenue Trends (Dynamic Range)
        // Fetch orders in range
        const trendOrders = await prisma.rentalOrder.findMany({
            where: {
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                createdAt: {
                    gte: trendStart,
                    lte: trendEnd
                }
            },
            select: { totalAmount: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        // Group by day - Dynamic Generation
        const trendsMap = new Map();
        // Fill gaps? If range is small (< 30 days), fill gaps. If large, sparse is maybe better?
        // Let's fill gaps roughly.
        const diffTime = Math.abs(trendEnd - trendStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Safety cap for filling gaps to avoid loop hang on bad dates
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
            // If map doesn't have key (e.g. range > 60 days, we just add existing data points)
            const current = trendsMap.get(key) || 0;
            trendsMap.set(key, current + Number(order.totalAmount));
        });

        // Convert Map to sorted array
        // If we didn't fill gaps (large range), we should assume 0? No, just plot points we have or allow gaps.
        // Frontend expects array of numbers. If we skip dates, graph loses X-axis context.
        // For MVP, if > 60 days, we might just return the values we found, or we rely on frontend not expecting perfect dates.
        // Actually, let's just return VALUES.
        const trends = Array.from(trendsMap.values());

        // 7. Top Rented Products (Filtered)
        // Prisma doesn't support deep relation filtering in Aggregate easily on older versions, but current supports it.
        // Logic: OrderLine -> Order.createdAt in range.

        // Alternative: Find Order IDs in range first.
        const orderIdsInRange = (await prisma.rentalOrder.findMany({
            where: {
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                ...dateFilter
            },
            select: { id: true }
        })).map(o => o.id);

        let topProductsWithStats = [];

        if (orderIdsInRange.length > 0) {
            const topProductsAgg = await prisma.orderLine.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                where: {
                    orderId: { in: orderIdsInRange }
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
            topProductsWithStats = topProducts.map(p => ({
                ...p,
                percent: Math.round((p.count / totalTopRents) * 100) + '%'
            }));
        }

        return NextResponse.json({
            revenue: totalRevenue,
            ordersProcessed,
            avgOrderValue: ordersProcessed > 0 ? totalRevenue / ordersProcessed : 0,
            activeRents,
            totalProducts,
            pendingOrders,
            trends,
            topProducts: topProductsWithStats
        });

    } catch (error) {
        console.error("Stats Error:", error);
        return NextResponse.json({ error: 'Stats error' }, { status: 500 });
    }
}
