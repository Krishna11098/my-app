import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        // In a real app, filter by vendor's orders. 
        // Here we fetch all or link via Order -> Product -> Vendor. 
        // For Hackathon/MVP, fetching all invoices is acceptable or we mock user context filter.

        const invoices = await prisma.invoice.findMany({
            include: {
                customer: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { issueDate: 'desc' }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Invoice Fetch Error:", error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}
