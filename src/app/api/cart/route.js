import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        const quotation = await prisma.quotation.findFirst({
            where: { customerId: userId, status: 'DRAFT' },
            include: { lines: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });

        if (!quotation) return NextResponse.json({ lines: [], subtotal: 0, message: 'No active cart found' });

        return NextResponse.json(quotation);
    } catch (e) {
        console.error("Cart GET Error:", e);
        return NextResponse.json({ error: 'Error fetching cart' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        // Now accepting 'type' (RENTAL or SALE) and dates
        const { userId, productId, quantity, type = 'RENTAL', startDate, endDate } = await req.json();

        if (!userId) return NextResponse.json({ error: 'User required' }, { status: 401 });

        // 1. Find active Draft Quotation
        let quotation = await prisma.quotation.findFirst({
            where: { customerId: userId, status: 'DRAFT' },
            include: { lines: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!productId) {
            return NextResponse.json({ error: 'Product required' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({ where: { id: productId }, include: { priceConfigs: true } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Calculate Duration (Default 1 Day)
        let duration = 1;
        let start = quotation?.rentalStart || new Date();
        let end = quotation?.rentalEnd || new Date(new Date().setDate(new Date().getDate() + 1));

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        } else if (quotation) {
            const diffTime = Math.abs(new Date(quotation.rentalEnd) - new Date(quotation.rentalStart));
            duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        }

        // Price logic based on Type
        let unitPrice = 0;
        let lineTotal = 0;

        console.log('[CART API] Type received:', type);
        console.log('[CART API] Duration:', duration, 'days');

        if (type === 'SALE') {
            unitPrice = Number(product.salePrice || 0);
            lineTotal = unitPrice * quantity;
            console.log('[CART API] SALE - unitPrice:', unitPrice, 'quantity:', quantity, 'lineTotal:', lineTotal);
        } else {
            const priceConfig = product.priceConfigs.find(p => p.periodUnit === 'DAY') || product.priceConfigs[0];
            unitPrice = priceConfig ? Number(priceConfig.price) : 0;
            // Line Total for Rental = Price/Day * Qty * Days
            lineTotal = unitPrice * quantity * duration;
            console.log('[CART API] RENTAL - unitPrice:', unitPrice, 'quantity:', quantity, 'duration:', duration, 'lineTotal:', lineTotal);
        }

        if (!quotation) {
            quotation = await prisma.quotation.create({
                data: {
                    customerId: userId,
                    quotationNumber: `QT-CART-${Date.now()}`,
                    status: 'DRAFT',
                    rentalStart: start,
                    rentalEnd: end,
                    subtotal: 0,
                    taxAmount: 0,
                    totalAmount: 0,
                    expiresAt: new Date(Date.now() + 7 * 86400000)
                },
                include: { lines: true }
            });
        } else if (startDate && endDate) {
            // Update dates if provided
            await prisma.quotation.update({
                where: { id: quotation.id },
                data: { rentalStart: start, rentalEnd: end }
            });
        }

        // Add/Update Line with per-item rental dates
        const existingLine = quotation.lines.find(l => l.productId === productId && l.type === type);

        if (existingLine) {
            const newQty = existingLine.quantity + quantity;
            if (newQty <= 0) {
                await prisma.quotationLine.delete({ where: { id: existingLine.id } });
            } else {
                // Recalculate line total for existing line with potentially new duration
                const newLineTotal = type === 'SALE'
                    ? newQty * unitPrice
                    : newQty * unitPrice * duration;

                await prisma.quotationLine.update({
                    where: { id: existingLine.id },
                    data: {
                        quantity: newQty,
                        lineTotal: newLineTotal,
                        rentalStart: type !== 'SALE' ? start : null,
                        rentalEnd: type !== 'SALE' ? end : null
                    }
                });
            }
        } else if (quantity > 0) {
            console.log('[CART API] Creating new line with type:', type, 'lineTotal:', lineTotal);
            await prisma.quotationLine.create({
                data: {
                    quotationId: quotation.id,
                    productId,
                    quantity,
                    type,
                    unitPrice,
                    lineTotal,
                    rentalStart: type !== 'SALE' ? start : null,
                    rentalEnd: type !== 'SALE' ? end : null
                }
            });
        }

        // Recalculate Totals with 18% tax
        const lines = await prisma.quotationLine.findMany({ where: { quotationId: quotation.id } });
        const sub = lines.reduce((acc, l) => acc + Number(l.lineTotal), 0);
        const tax = Math.round(sub * 0.18);
        const total = sub + tax;

        await prisma.quotation.update({
            where: { id: quotation.id },
            data: { subtotal: sub, taxAmount: tax, totalAmount: total }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Cart POST Error:", e);
        return NextResponse.json({ error: 'Error adding to cart' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const lineId = searchParams.get('lineId');

        if (!lineId) return NextResponse.json({ error: 'Line ID required' }, { status: 400 });

        const line = await prisma.quotationLine.findUnique({ where: { id: lineId } });
        if (!line) return NextResponse.json({ error: 'Line not found' }, { status: 404 });

        await prisma.quotationLine.delete({ where: { id: lineId } });

        // Recalc
        const lines = await prisma.quotationLine.findMany({ where: { quotationId: line.quotationId } });
        const sub = lines.reduce((acc, l) => acc + Number(l.lineTotal), 0);
        await prisma.quotation.update({
            where: { id: line.quotationId },
            data: { subtotal: sub, totalAmount: sub }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Error deleting line' }, { status: 500 });
    }
}
