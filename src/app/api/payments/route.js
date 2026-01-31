import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST: Create a payment order
export async function POST(req) {
    try {
        const { orderId, amount, invoiceId } = await req.json();

        if (!orderId && !invoiceId) {
            return NextResponse.json({ error: 'Order ID or Invoice ID required' }, { status: 400 });
        }

        let order, invoice;

        if (orderId) {
            order = await prisma.rentalOrder.findUnique({
                where: { id: orderId },
                include: { customer: true, invoice: true }
            });
            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }
            invoice = order.invoice;
        } else {
            invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: { customer: true }
            });
            if (!invoice) {
                return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            }
        }

        const paymentAmount = amount || (invoice ? Number(invoice.totalAmount) - Number(invoice.amountPaid) : Number(order.totalAmount) - Number(order.amountPaid));

        if (paymentAmount <= 0) {
            return NextResponse.json({ error: 'No amount due' }, { status: 400 });
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(paymentAmount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: {
                orderId: orderId || '',
                invoiceId: invoice?.id || ''
            }
        });

        return NextResponse.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create Payment Error:', error);
        return NextResponse.json({ error: error.message || 'Payment creation failed' }, { status: 500 });
    }
}

// PUT: Verify payment and update records
export async function PUT(req) {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            orderId,
            invoiceId,
            amount
        } = await req.json();

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        const paymentAmount = Number(amount) / 100; // Convert from paise

        const result = await prisma.$transaction(async (tx) => {
            // Create payment record
            const paymentCount = await tx.payment.count();
            const payment = await tx.payment.create({
                data: {
                    paymentNumber: `PAY-${new Date().getFullYear()}-${(paymentCount + 1).toString().padStart(4, '0')}`,
                    invoiceId: invoiceId || null,
                    orderId: orderId || null,
                    amount: paymentAmount,
                    method: 'RAZORPAY',
                    transactionId: razorpay_payment_id,
                    status: 'COMPLETED',
                    paidAt: new Date()
                }
            });

            // Update invoice if exists
            if (invoiceId) {
                const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
                const newAmountPaid = Number(invoice.amountPaid) + paymentAmount;
                const newStatus = newAmountPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';

                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        amountPaid: newAmountPaid,
                        status: newStatus
                    }
                });
            }

            // Update order if exists
            if (orderId) {
                const order = await tx.rentalOrder.findUnique({ where: { id: orderId } });
                const newAmountPaid = Number(order.amountPaid) + paymentAmount;

                await tx.rentalOrder.update({
                    where: { id: orderId },
                    data: { amountPaid: newAmountPaid }
                });

                // Also update linked invoice
                if (order.invoice) {
                    const invoice = await tx.invoice.findFirst({ where: { orderId } });
                    if (invoice) {
                        const invNewAmountPaid = Number(invoice.amountPaid) + paymentAmount;
                        await tx.invoice.update({
                            where: { id: invoice.id },
                            data: {
                                amountPaid: invNewAmountPaid,
                                status: invNewAmountPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL'
                            }
                        });
                    }
                }
            }

            return payment;
        });

        return NextResponse.json({ 
            success: true, 
            paymentId: result.id,
            message: 'Payment verified and recorded successfully'
        });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
    }
}
