import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: {
                lines: {
                    include: { product: true }
                },
                customer: true
            }
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        return NextResponse.json(quotation);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching quotation' }, { status: 500 });
    }
}
