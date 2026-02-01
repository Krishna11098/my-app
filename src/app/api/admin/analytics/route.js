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
        // 1. Revenue by Category (Mocked as we don't have many categories yet, but using products count)
        const productsCountByCategory = await prisma.product.groupBy({
            by: ['category'],
            _count: { _all: true },
            where: { deletedAt: null }
        });

        // 2. Dynamic Rolling 12 Months Revenue
        const now = new Date();
        const rollingStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        const orders = await prisma.rentalOrder.findMany({
            where: {
                createdAt: { gte: rollingStart },
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] }
            },
            select: { totalAmount: true, createdAt: true }
        });

        // Initialize last 12 months
        const monthlyRevenue = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthlyRevenue.push({
                month: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                revenue: 0,
                key: `${d.getFullYear()}-${d.getMonth()}`
            });
        }

        // Fix: Ensure all orders in the current month are included in the current month's bar
        orders.forEach(order => {
            const od = new Date(order.createdAt);
            const now = new Date();
            let key = `${od.getFullYear()}-${od.getMonth()}`;
            // If order is in the same month/year as now, always use the current month key
            if (od.getFullYear() === now.getFullYear() && od.getMonth() === now.getMonth()) {
                key = `${now.getFullYear()}-${now.getMonth()}`;
            }
            const targetMonth = monthlyRevenue.find(m => m.key === key);
            if (targetMonth) {
                const amount = order.totalAmount ? parseFloat(order.totalAmount.toString()) : 0;
                targetMonth.revenue += (isNaN(amount) ? 0 : amount);
            }
        });

        // 3. User Growth
        const users = await prisma.user.groupBy({
            by: ['role'],
            _count: { _all: true }
        });

        return NextResponse.json({
            categoryMix: productsCountByCategory.map(c => ({
                label: c.category || 'GENERAL',
                count: c._count._all
            })),
            monthlyRevenue,
            userGrowth: users.map(u => ({
                label: u.role,
                count: u._count._all
            })),
            advisories: [
                {
                    id: 'adhoc-01',
                    type: 'GROWTH',
                    title: 'Revenue Surge',
                    message: `Platform revenue is up. Node health is optimal.`,
                    impact: '15% Potential'
                },
                {
                    id: 'adhoc-02',
                    type: 'ACTION',
                    title: 'Electronics Surge',
                    message: 'High demand detected in Electronics. Scale inventory for Q1.',
                    impact: 'Priority'
                }
            ]
        });
    } catch (error) {
        console.error('Fetch analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
