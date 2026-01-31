import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Process return for an order
export async function POST(req) {
    try {
        const { orderId, items, notes } = await req.json();
        // items = [{ productId, quantity, condition: 'GOOD' | 'DAMAGED' }]

        const order = await prisma.rentalOrder.findUnique({
            where: { id: orderId },
            include: { 
                lines: true,
                return: true,
                customer: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.return) {
            return NextResponse.json({ error: 'Return already processed' }, { status: 400 });
        }

        // Calculate late days and fees
        const today = new Date();
        const rentalEnd = new Date(order.rentalEnd);
        let lateDays = 0;
        let lateFee = 0;

        if (today > rentalEnd) {
            lateDays = Math.ceil((today - rentalEnd) / (1000 * 60 * 60 * 24));
            // Late fee: 10% of daily rate per late day
            const dailyRate = Number(order.subtotal) / Math.ceil((rentalEnd - new Date(order.rentalStart)) / (1000 * 60 * 60 * 24));
            lateFee = lateDays * dailyRate * 0.1;
        }

        // Calculate damage fee
        let damageFee = 0;
        for (const item of items) {
            if (item.condition === 'DAMAGED') {
                const line = order.lines.find(l => l.productId === item.productId);
                if (line) {
                    // Damage fee: 50% of item value
                    damageFee += Number(line.lineTotal) * 0.5;
                }
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create Return Document
            const returnCount = await tx.return.count();
            const returnDoc = await tx.return.create({
                data: {
                    orderId: order.id,
                    returnNumber: `RTN-${new Date().getFullYear()}-${(returnCount + 1).toString().padStart(4, '0')}`,
                    returnDate: today,
                    lateDays,
                    lateFee,
                    damageFee,
                    status: 'COMPLETED',
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            condition: item.condition || 'GOOD'
                        }))
                    }
                }
            });

            // Restore stock for GOOD items
            for (const item of items) {
                if (item.condition === 'GOOD') {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { quantityOnHand: { increment: item.quantity } }
                    });

                    // Create stock movement
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            quantity: item.quantity,
                            movementType: 'RETURN',
                            referenceId: returnDoc.id,
                            referenceType: 'RETURN',
                            remarks: `Returned from order ${order.orderNumber}`
                        }
                    });
                }
            }

            // Update order status
            await tx.rentalOrder.update({
                where: { id: orderId },
                data: { status: 'RETURNED' }
            });

            // Update pickup status if exists
            await tx.pickup.updateMany({
                where: { orderId },
                data: { status: 'COMPLETED' }
            });

            // Delete reservations (rental period ended)
            await tx.reservation.deleteMany({
                where: { orderId }
            });

            // If there are late/damage fees, create additional invoice
            if (lateFee > 0 || damageFee > 0) {
                const invCount = await tx.invoice.count();
                await tx.invoice.create({
                    data: {
                        customerId: order.customerId,
                        invoiceNumber: `INV-${new Date().getFullYear()}-${(invCount + 1).toString().padStart(4, '0')}-FEES`,
                        status: 'DRAFT',
                        issueDate: today,
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        subtotal: lateFee + damageFee,
                        taxAmount: (lateFee + damageFee) * 0.18,
                        totalAmount: (lateFee + damageFee) * 1.18,
                        amountPaid: 0,
                        securityDeposit: 0,
                        notes: `Late fee: ₹${lateFee.toFixed(2)}, Damage fee: ₹${damageFee.toFixed(2)}`
                    }
                });
            }

            return returnDoc;
        });

        return NextResponse.json({ 
            success: true, 
            returnId: result.id,
            lateDays,
            lateFee,
            damageFee
        });
    } catch (error) {
        console.error('Return Error:', error);
        return NextResponse.json({ error: error.message || 'Return processing failed' }, { status: 500 });
    }
}

// GET: Get returns for vendor
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const vendorId = searchParams.get('vendorId');

        if (!vendorId) {
            return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
        }

        // Get all returns for orders containing vendor's products
        const returns = await prisma.return.findMany({
            where: {
                order: {
                    lines: {
                        some: {
                            product: { vendorId }
                        }
                    }
                }
            },
            include: {
                order: {
                    include: {
                        customer: { select: { name: true, email: true } },
                        lines: { include: { product: true } }
                    }
                },
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(returns);
    } catch (error) {
        console.error('Get Returns Error:', error);
        return NextResponse.json({ error: 'Error fetching returns' }, { status: 500 });
    }
}
