import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req) {
    try {
        const { 
            quotationId, 
            paymentId, 
            razorpayOrderId, 
            addressId,
            billingAddressId,
            billingIsSame = true,
            deliveryMethod = 'STANDARD_DELIVERY',
            couponCode,
            discountAmount = 0
        } = await req.json();

        // 1. Fetch Quotation with product vendor info
        const quotation = await prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { 
                lines: { 
                    include: { 
                        product: {
                            include: {
                                vendor: {
                                    select: { id: true, name: true, companyName: true }
                                }
                            }
                        } 
                    } 
                }, 
                order: true, 
                customer: true 
            }
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        if (quotation.status === 'CONFIRMED' || quotation.order) {
            if (quotation.order) {
                return NextResponse.json({ success: true, orderId: quotation.order.id, message: 'Order was already confirmed' });
            }
            return NextResponse.json({ error: 'Order already confirmed' }, { status: 400 });
        }

        // 2. STOCK AVAILABILITY CHECK
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

        // 3. Group lines by vendor for multi-vendor order splitting
        const linesByVendor = {};
        for (const line of quotation.lines) {
            const vendorId = line.product?.vendorId || 'DEFAULT';
            if (!linesByVendor[vendorId]) {
                linesByVendor[vendorId] = {
                    vendorId: vendorId === 'DEFAULT' ? null : vendorId,
                    vendorName: line.product?.vendor?.companyName || line.product?.vendor?.name || 'Platform',
                    lines: []
                };
            }
            linesByVendor[vendorId].lines.push(line);
        }

        const vendorGroups = Object.values(linesByVendor);
        const isSingleVendor = vendorGroups.length === 1;

        // 4. Create Orders in Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Get or create pickup address
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

            const createdOrders = [];

            // Calculate per-vendor discount allocation (proportional)
            const totalQuotationAmount = vendorGroups.reduce((sum, g) => 
                sum + g.lines.reduce((s, l) => s + parseFloat(l.lineTotal), 0), 0);

            // Create separate order for each vendor
            for (const group of vendorGroups) {
                // Calculate totals for this vendor's items
                const vendorSubtotal = group.lines.reduce((sum, l) => sum + parseFloat(l.lineTotal), 0);
                const vendorTax = vendorSubtotal * 0.18; // 18% GST
                
                // Proportional discount allocation
                const vendorDiscountRatio = totalQuotationAmount > 0 ? vendorSubtotal / totalQuotationAmount : 0;
                const vendorDiscount = discountAmount * vendorDiscountRatio;
                const vendorTotal = vendorSubtotal + vendorTax - vendorDiscount;

                // Create Order for this vendor
                const orderCount = await tx.rentalOrder.count();
                const orderNumber = `ORD-${new Date().getFullYear()}-${(orderCount + 1).toString().padStart(4, '0')}`;

                const order = await tx.rentalOrder.create({
                    data: {
                        customerId: quotation.customerId,
                        vendorId: group.vendorId, // Link to specific vendor
                        quotationId: isSingleVendor ? quotation.id : null, // Only link quotation if single vendor
                        orderNumber,
                        status: 'CONFIRMED',
                        subtotal: vendorSubtotal,
                        taxAmount: vendorTax,
                        totalAmount: vendorTotal,
                        discountAmount: vendorDiscount,
                        securityDeposit: 0,
                        amountPaid: vendorTotal,
                        deliveryMethod: deliveryMethod,
                        rentalStart: quotation.rentalStart,
                        rentalEnd: quotation.rentalEnd,
                        pickupAddressId: userAddrId,
                        returnAddressId: userAddrId,
                        billingAddressId: billingIsSame ? userAddrId : (billingAddressId || userAddrId),
                        billingIsSame: billingIsSame,
                        couponCode: couponCode || null,
                        notes: isSingleVendor ? null : `Split order from quotation ${quotation.quotationNumber}`
                    }
                });

                // Create Order Lines
                await tx.orderLine.createMany({
                    data: group.lines.map(l => ({
                        orderId: order.id,
                        productId: l.productId,
                        quantity: l.quantity,
                        type: l.type || 'RENTAL',
                        unitPrice: l.unitPrice,
                        lineTotal: l.lineTotal,
                        rentalStart: l.rentalStart || quotation.rentalStart,
                        rentalEnd: l.rentalEnd || quotation.rentalEnd
                    }))
                });

                // Create Reservations for rental items
                const rentalLines = group.lines.filter(l => l.type !== 'SALE');
                if (rentalLines.length > 0) {
                    const productReservations = {};
                    for (const l of rentalLines) {
                        const fromDate = l.rentalStart || quotation.rentalStart;
                        const toDate = l.rentalEnd || quotation.rentalEnd;
                        const key = `${l.productId}-${fromDate.toISOString()}-${toDate.toISOString()}`;
                        if (productReservations[key]) {
                            productReservations[key].quantity += l.quantity;
                        } else {
                            productReservations[key] = {
                                productId: l.productId,
                                orderId: order.id,
                                quantity: l.quantity,
                                fromDate: fromDate,
                                toDate: toDate
                            };
                        }
                    }
                    await tx.reservation.createMany({
                        data: Object.values(productReservations),
                        skipDuplicates: true
                    });
                }

                // Decrement stock for purchase items
                const purchaseLines = group.lines.filter(l => l.type === 'SALE');
                for (const line of purchaseLines) {
                    await tx.product.update({
                        where: { id: line.productId },
                        data: { quantityOnHand: { decrement: line.quantity } }
                    });
                }

                // Create Invoice for this vendor
                const invCount = await tx.invoice.count();
                await tx.invoice.create({
                    data: {
                        orderId: order.id,
                        customerId: quotation.customerId,
                        vendorId: group.vendorId, // Link invoice to vendor
                        invoiceNumber: `INV-${new Date().getFullYear()}-${(invCount + 1).toString().padStart(4, '0')}`,
                        status: 'PAID',
                        issueDate: new Date(),
                        dueDate: new Date(),
                        subtotal: vendorSubtotal,
                        taxAmount: vendorTax,
                        totalAmount: vendorTotal,
                        amountPaid: vendorTotal,
                        securityDeposit: 0
                    }
                });

                // Create Pickup Document
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

                    // Create stock movements
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

                createdOrders.push(order);
            }

            // Update Quotation Status
            await tx.quotation.update({
                where: { id: quotationId },
                data: { status: 'CONFIRMED' }
            });

            // Track coupon usage if coupon was applied
            if (couponCode) {
                const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
                if (coupon) {
                    // Record usage for each order
                    for (const order of createdOrders) {
                        await tx.couponUsage.create({
                            data: {
                                couponId: coupon.id,
                                userId: quotation.customerId,
                                orderId: order.id
                            }
                        });
                    }
                    // Increment usage count
                    await tx.coupon.update({
                        where: { id: coupon.id },
                        data: { usageCount: { increment: 1 } }
                    });
                }
            }

            return createdOrders;
        });

        // Send confirmation email for each order
        for (const order of result) {
            try {
                const completeOrder = await prisma.rentalOrder.findUnique({
                    where: { id: order.id },
                    include: { 
                        lines: { include: { product: true } }, 
                        customer: true,
                        vendor: { select: { companyName: true, name: true } }
                    }
                });
                await sendOrderConfirmationEmail(completeOrder, quotation.customer);
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }
        }

        // Return first order id for redirect, or all if multiple
        return NextResponse.json({ 
            success: true, 
            orderId: result[0]?.id,
            orderIds: result.map(o => o.id),
            orderCount: result.length,
            message: result.length > 1 
                ? `Order split into ${result.length} orders for different vendors` 
                : 'Order confirmed successfully'
        });
    } catch (error) {
        console.error('Confirm Order Error:', error);
        return NextResponse.json({ error: error.message || 'Confirmation failed' }, { status: 500 });
    }
}
