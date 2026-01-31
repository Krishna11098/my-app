import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        let order = await prisma.rentalOrder.findUnique({
            where: { id },
            include: {
                lines: { include: { product: true } },
                customer: {
                    select: { id: true, name: true, email: true, companyName: true, gstin: true, phone: true }
                },
                vendor: {
                    select: { id: true, name: true, companyName: true, companyLogo: true, email: true, phone: true }
                },
                invoice: { include: { payments: true } },
                pickup: { include: { items: true } },
                return: { include: { items: true } },
                reservations: true,
                pickupAddress: true,
                returnAddress: true,
                billingAddress: true
            }
        });

        if (!order) {
            const quotation = await prisma.quotation.findUnique({
                where: { id },
                include: {
                    lines: { include: { product: true } },
                    customer: {
                        select: { id: true, name: true, email: true, companyName: true, gstin: true, phone: true }
                    },
                    invoice: { include: { payments: true } }
                }
            });

            if (!quotation) {
                return NextResponse.json({ error: 'Order or Quotation not found' }, { status: 404 });
            }

            // Map quotation to order structure
            order = {
                ...quotation,
                orderNumber: quotation.quotationNumber,
                amountPaid: quotation.totalAmount, // Mock as full paid for confirmed quotes in detail view
                lines: quotation.lines,
                customer: quotation.customer,
                invoice: quotation.invoice
            };
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Get Order Error:', error);
        return NextResponse.json({ error: 'Error fetching order' }, { status: 500 });
    }
}
