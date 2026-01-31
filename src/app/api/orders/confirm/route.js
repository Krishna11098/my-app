import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
    try {
        const { quotationId } = await req.json();

        // 1. Fetch Quotation
        const quotation = await prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { lines: true }
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        if (quotation.status === 'CONFIRMED' || quotation.order) { // Check if already ordered? Relations might not be loaded, check status
            return NextResponse.json({ error: 'Order already confirmed' }, { status: 400 });
        }

        // 2. STOCK AVAILABILITY CHECK (Reservation)
        // For each item, checking if sum(reserved) + 1 <= quantityOnHand
        // This is complex. For now, we will just CREATE Reservations and assume availability is checked on product page or optimistically.
        // A robust system would lock here.
        // We defined "Reservation" model.

        /* 
           Reservation Logic:
           Find existing reservations for this product overlapping [rentalStart, rentalEnd].
           Sum quantities.
           If Product.quantityOnHand < (Sum + requested), Throw Error.
        */

        for (const line of quotation.lines) {
            const product = await prisma.product.findUnique({ where: { id: line.productId } });

            const conflictingReservations = await prisma.reservation.findMany({
                where: {
                    productId: line.productId,
                    OR: [
                        { fromDate: { lte: quotation.rentalEnd }, toDate: { gte: quotation.rentalStart } }
                    ]
                }
            });

            const reservedQuantity = conflictingReservations.reduce((acc, curr) => acc + curr.quantity, 0);

            if (reservedQuantity + line.quantity > product.quantityOnHand) {
                return NextResponse.json({ error: `Not enough stock for ${product.name} on selected dates.` }, { status: 400 });
            }
        }


        // 3. Create Rental Order, Invoice, and Reservations in Transaction
        const result = await prisma.$transaction(async (tx) => {

            // Create Order
            const count = await tx.rentalOrder.count();
            const orderNumber = `ORD-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

            const order = await tx.rentalOrder.create({
                data: {
                    customerId: quotation.customerId,
                    quotationId: quotation.id,
                    orderNumber,
                    status: 'CONFIRMED',
                    subtotal: quotation.subtotal,
                    taxAmount: quotation.taxAmount,
                    totalAmount: quotation.totalAmount,
                    securityDeposit: 0, // Mock for now
                    amountPaid: quotation.totalAmount, // Assuming full payment simulation
                    rentalStart: quotation.rentalStart,
                    rentalEnd: quotation.rentalEnd,
                    pickupAddressId: 'default-address-id-placeholder', // We need a real address. 
                    // Quick fix: Find user's address or create one.
                    // Or since we don't have address selection in UI yet, we mock or skip validation if schema allows.
                    // Schema: `pickupAddressId String`. It's required.
                    // Let's find first address of user or create dummy.
                }
            });

            // Need to fix Address relation issue if strictly required. 
            // In schema: `pickupAddress Address ...`.
            // Let's create a dummy address if user has none.
            const userAddr = await tx.address.findFirst({ where: { userId: quotation.customerId } });
            let addrId = userAddr?.id;

            if (!addrId) {
                const newAddr = await tx.address.create({
                    data: {
                        userId: quotation.customerId,
                        street: 'Default Pickup',
                        city: 'City',
                        state: 'State',
                        postalCode: '000000'
                    }
                });
                addrId = newAddr.id;
                // Update order with address
                await tx.rentalOrder.update({ where: { id: order.id }, data: { pickupAddressId: addrId } });
            } else {
                await tx.rentalOrder.update({ where: { id: order.id }, data: { pickupAddressId: addrId } });
            }

            // Create Order Lines
            await tx.orderLine.createMany({
                data: quotation.lines.map(l => ({
                    orderId: order.id,
                    productId: l.productId,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    lineTotal: l.lineTotal
                }))
            });

            // Create Reservations
            await tx.reservation.createMany({
                data: quotation.lines.map(l => ({
                    productId: l.productId,
                    orderId: order.id,
                    quantity: l.quantity,
                    fromDate: quotation.rentalStart,
                    toDate: quotation.rentalEnd
                }))
            });

            // Create Invoice
            const invCount = await tx.invoice.count();
            await tx.invoice.create({
                data: {
                    orderId: order.id,
                    customerId: quotation.customerId,
                    invoiceNumber: `INV-${new Date().getFullYear()}-${(invCount + 1).toString().padStart(4, '0')}`,
                    status: 'PAID', // Assuming instant payment
                    issueDate: new Date(),
                    dueDate: new Date(),
                    subtotal: quotation.subtotal,
                    taxAmount: quotation.taxAmount,
                    totalAmount: quotation.totalAmount,
                    amountPaid: quotation.totalAmount,
                    securityDeposit: 0
                }
            });

            // Update Quotation Status
            await tx.quotation.update({
                where: { id: quotationId },
                data: { status: 'CONFIRMED' }
            });

            return order;
        });

        return NextResponse.json({ success: true, orderId: result.id });
    } catch (error) {
        console.error('Confirm Order Error:', error);
        return NextResponse.json({ error: error.message || 'Confirmation failed' }, { status: 500 });
    }
}
