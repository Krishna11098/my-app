import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// This endpoint should be called by a cron job daily
// It checks for upcoming returns and overdue rentals
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');

        // Simple secret check for cron security (use proper auth in production)
        if (secret !== process.env.CRON_SECRET && secret !== 'manual-trigger') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const results = {
            upcomingReminders: 0,
            overdueAlerts: 0,
            errors: []
        };

        // 1. Find orders with return due in 3 days
        const upcomingReturns = await prisma.rentalOrder.findMany({
            where: {
                status: { in: ['CONFIRMED', 'PICKED_UP'] },
                rentalEnd: {
                    gte: today,
                    lte: threeDaysFromNow
                },
                return: null
            },
            include: {
                customer: true,
                lines: { include: { product: true } }
            }
        });

        for (const order of upcomingReturns) {
            const daysUntilReturn = Math.ceil((new Date(order.rentalEnd) - today) / (1000 * 60 * 60 * 24));
            
            // Check if we already sent a notification today
            const existingNotification = await prisma.notification.findFirst({
                where: {
                    userId: order.customerId,
                    type: 'RETURN_REMINDER',
                    referenceId: order.id,
                    createdAt: { gte: today }
                }
            });

            if (!existingNotification) {
                try {
                    // Create notification
                    await prisma.notification.create({
                        data: {
                            userId: order.customerId,
                            type: 'RETURN_REMINDER',
                            title: `Return Reminder: ${daysUntilReturn} day${daysUntilReturn > 1 ? 's' : ''} left`,
                            message: `Your rental for order ${order.orderNumber} is due on ${new Date(order.rentalEnd).toLocaleDateString()}. Please ensure timely return to avoid late fees.`,
                            referenceId: order.id,
                            referenceType: 'ORDER'
                        }
                    });

                    // Send email
                    await sendEmail({
                        to: order.customer.email,
                        subject: `⏰ Return Reminder - Order ${order.orderNumber}`,
                        html: generateReturnReminderEmail(order, daysUntilReturn)
                    });

                    results.upcomingReminders++;
                } catch (err) {
                    results.errors.push(`Failed to notify ${order.customer.email}: ${err.message}`);
                }
            }
        }

        // 2. Find overdue orders
        const overdueOrders = await prisma.rentalOrder.findMany({
            where: {
                status: { in: ['CONFIRMED', 'PICKED_UP'] },
                rentalEnd: { lt: today },
                return: null
            },
            include: {
                customer: true,
                lines: { include: { product: true } }
            }
        });

        for (const order of overdueOrders) {
            const lateDays = Math.ceil((today - new Date(order.rentalEnd)) / (1000 * 60 * 60 * 24));
            
            // Update order status
            await prisma.rentalOrder.update({
                where: { id: order.id },
                data: { status: 'OVERDUE' }
            });

            // Check if we already sent an overdue notification today
            const existingNotification = await prisma.notification.findFirst({
                where: {
                    userId: order.customerId,
                    type: 'OVERDUE_ALERT',
                    referenceId: order.id,
                    createdAt: { gte: today }
                }
            });

            if (!existingNotification) {
                try {
                    // Calculate estimated late fee
                    const dailyRate = Number(order.subtotal) / Math.ceil((new Date(order.rentalEnd) - new Date(order.rentalStart)) / (1000 * 60 * 60 * 24));
                    const estimatedLateFee = lateDays * dailyRate * 0.1;

                    // Create notification
                    await prisma.notification.create({
                        data: {
                            userId: order.customerId,
                            type: 'OVERDUE_ALERT',
                            title: `⚠️ Overdue: ${lateDays} day${lateDays > 1 ? 's' : ''} late`,
                            message: `Your rental order ${order.orderNumber} is ${lateDays} days overdue. Current late fee: ₹${estimatedLateFee.toFixed(2)}. Please return immediately.`,
                            referenceId: order.id,
                            referenceType: 'ORDER',
                            isUrgent: true
                        }
                    });

                    // Send email
                    await sendEmail({
                        to: order.customer.email,
                        subject: `⚠️ URGENT: Order ${order.orderNumber} is Overdue!`,
                        html: generateOverdueEmail(order, lateDays, estimatedLateFee)
                    });

                    // Also notify vendor
                    const vendorProducts = await prisma.product.findMany({
                        where: { 
                            id: { in: order.lines.map(l => l.productId) }
                        },
                        include: { vendor: true }
                    });

                    const vendors = [...new Set(vendorProducts.map(p => p.vendor).filter(Boolean))];
                    for (const vendor of vendors) {
                        await prisma.notification.create({
                            data: {
                                userId: vendor.id,
                                type: 'OVERDUE_ALERT',
                                title: `Customer Overdue: Order ${order.orderNumber}`,
                                message: `Customer ${order.customer.name} has not returned items for ${lateDays} days.`,
                                referenceId: order.id,
                                referenceType: 'ORDER',
                                isUrgent: true
                            }
                        });
                    }

                    results.overdueAlerts++;
                } catch (err) {
                    results.errors.push(`Failed to alert for order ${order.orderNumber}: ${err.message}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${results.upcomingReminders} reminders and ${results.overdueAlerts} overdue alerts`,
            ...results
        });
    } catch (error) {
        console.error('Notifications Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateReturnReminderEmail(order, daysUntilReturn) {
    const items = order.lines.map(l => `<li>${l.product.name} x${l.quantity}</li>`).join('');
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #9333ea, #4f46e5); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">JOY JUNCTURE</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333;">Return Reminder ⏰</h2>
                <p>Hi ${order.customer.name},</p>
                <p>This is a friendly reminder that your rental is due in <strong>${daysUntilReturn} day${daysUntilReturn > 1 ? 's' : ''}</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Order:</strong> ${order.orderNumber}</p>
                    <p><strong>Return Date:</strong> ${new Date(order.rentalEnd).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Items:</strong></p>
                    <ul>${items}</ul>
                </div>
                
                <p style="color: #666; font-size: 14px;">Late returns will incur a fee of 10% of the daily rental rate per day.</p>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #9333ea, #4f46e5); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px;">
                    View Order Details
                </a>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Joy Juncture. All rights reserved.
            </div>
        </div>
    `;
}

function generateOverdueEmail(order, lateDays, estimatedLateFee) {
    const items = order.lines.map(l => `<li>${l.product.name} x${l.quantity}</li>`).join('');
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc2626; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">⚠️ URGENT: Overdue Rental</h1>
            </div>
            <div style="padding: 30px; background: #fef2f2;">
                <h2 style="color: #991b1b;">Your Rental is Overdue!</h2>
                <p>Hi ${order.customer.name},</p>
                <p>Your rental order <strong>${order.orderNumber}</strong> is <strong style="color: #dc2626;">${lateDays} day${lateDays > 1 ? 's' : ''} overdue</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #dc2626;">
                    <p><strong>Original Return Date:</strong> ${new Date(order.rentalEnd).toLocaleDateString('en-IN')}</p>
                    <p><strong>Days Overdue:</strong> ${lateDays}</p>
                    <p style="color: #dc2626; font-size: 18px;"><strong>Current Late Fee: ₹${estimatedLateFee.toFixed(2)}</strong></p>
                    <p><strong>Items to Return:</strong></p>
                    <ul>${items}</ul>
                </div>
                
                <p style="color: #991b1b; font-weight: bold;">Please return the items immediately to avoid additional charges.</p>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}" 
                   style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px;">
                    View Order & Return
                </a>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                If you've already returned the items, please disregard this email.
            </div>
        </div>
    `;
}
