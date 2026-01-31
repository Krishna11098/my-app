import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req) {
    try {
        const { quotationId, paymentId, razorpayOrderId, addressId } = await req.json();

        // 1. Fetch Quotation
        const quotation = await prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { lines: { include: { product: true } }, order: true, customer: true }
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        if (quotation.status === 'CONFIRMED' || quotation.order) {
            // Already confirmed - return success with existing order
            if (quotation.order) {
                return NextResponse.json({ success: true, orderId: quotation.order.id, message: 'Order was already confirmed' });
            }
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

            // Use provided addressId or find/create default address
            let userAddrId = addressId;
            
            if (!userAddrId) {
                let userAddr = await tx.address.findFirst({ where: { userId: quotation.customerId } });

                if (!userAddr) {
                    userAddr = await tx.address.create({
                        data: {
                            userId: quotation.customerId,
                            street: 'Default Pickup Address',
                            city: 'City',
                            state: 'State',
                            postalCode: '000000',
                            isDefault: true
                        }
                    });
                }
                userAddrId = userAddr.id;
            }

            // Create Order with valid address
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
                    securityDeposit: 0,
                    amountPaid: quotation.totalAmount,
                    rentalStart: quotation.rentalStart,
                    rentalEnd: quotation.rentalEnd,
                    pickupAddressId: userAddrId,
                    returnAddressId: userAddrId
                }
            });

            // Create Order Lines
            await tx.orderLine.createMany({
                data: quotation.lines.map(l => ({
                    orderId: order.id,
                    productId: l.productId,
                    quantity: l.quantity,
                    type: l.type || 'RENTAL', // Include type from quotation line
                    unitPrice: l.unitPrice,
                    lineTotal: l.lineTotal
                }))
            });

            // Create Reservations (only for RENTAL items, not SALE/purchase items)
            const rentalLines = quotation.lines.filter(l => l.type !== 'SALE');
            if (rentalLines.length > 0) {
                // Group by productId to avoid duplicate reservations for same product
                const productReservations = {};
                for (const l of rentalLines) {
                    if (productReservations[l.productId]) {
                        productReservations[l.productId].quantity += l.quantity;
                    } else {
                        productReservations[l.productId] = {
                            productId: l.productId,
                            orderId: order.id,
                            quantity: l.quantity,
                            fromDate: quotation.rentalStart,
                            toDate: quotation.rentalEnd
                        };
                    }
                }
                await tx.reservation.createMany({
                    data: Object.values(productReservations),
                    skipDuplicates: true
                });
            }

            // For SALE (purchase) items, reduce stock permanently
            const purchaseLines = quotation.lines.filter(l => l.type === 'SALE');
            for (const line of purchaseLines) {
                await tx.product.update({
                    where: { id: line.productId },
                    data: { quantityOnHand: { decrement: line.quantity } }
                });
            }

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

            // Create Pickup Document (only for rental items)
            if (rentalLines.length > 0) {
                const pickupCount = await tx.pickup.count();
                await tx.pickup.create({
                    data: {
                        orderId: order.id,
                        pickupNumber: `PKP-${new Date().getFullYear()}-${(pickupCount + 1).toString().padStart(4, '0')}`,
                        pickupDate: quotation.rentalStart,
                        instructions: 'Please bring a valid ID for verification. Check all items before leaving.',
                        status: 'PENDING',
                        items: {
                            create: rentalLines.map(l => ({
                                productId: l.productId,
                                quantity: l.quantity
                            }))
                        }
                    }
                });

                // Create stock movements for items going to customer
                for (const line of rentalLines) {
                    await tx.stockMovement.create({
                        data: {
                            productId: line.productId,
                            quantity: -line.quantity,
                            movementType: 'PICKUP',
                            referenceId: order.id,
                            referenceType: 'ORDER',
                            remarks: `Rented out for order ${order.orderNumber}`
                        }
                    });
                }
            }

            // Update Quotation Status
            await tx.quotation.update({
                where: { id: quotationId },
                data: { status: 'CONFIRMED' }
            });

            return order;
        });

        // Fetch complete order with relations for email
        const completeOrder = await prisma.rentalOrder.findUnique({
            where: { id: result.id },
            include: { lines: { include: { product: true } }, customer: true }
        });

        // Send confirmation email
        try {
            await sendOrderConfirmationEmail(completeOrder, quotation.customer);
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail the order if email fails
        }

        return NextResponse.json({ success: true, orderId: result.id });
    } catch (error) {
        console.error('Confirm Order Error:', error);
        return NextResponse.json({ error: error.message || 'Confirmation failed' }, { status: 500 });
    }
}
