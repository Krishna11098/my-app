import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    try {
        // Get user from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch {}
        }

        const { code, orderAmount } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        // Find coupon
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
        }

        // Check validity period
        const now = new Date();
        if (now < coupon.validFrom) {
            return NextResponse.json({ error: 'This coupon is not yet valid' }, { status: 400 });
        }
        if (now > coupon.validUntil) {
            return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
        }

        // Check per-user limit
        if (userId && coupon.perUserLimit) {
            const userUsages = await prisma.couponUsage.count({
                where: { couponId: coupon.id, userId }
            });
            if (userUsages >= coupon.perUserLimit) {
                return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
            }
        }

        // Check minimum order amount
        const amount = parseFloat(orderAmount) || 0;
        if (coupon.minOrderAmount && amount < parseFloat(coupon.minOrderAmount)) {
            return NextResponse.json({ 
                error: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
            }, { status: 400 });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = amount * (parseFloat(coupon.discountValue) / 100);
            // Apply max discount cap
            if (coupon.maxDiscount && discountAmount > parseFloat(coupon.maxDiscount)) {
                discountAmount = parseFloat(coupon.maxDiscount);
            }
        } else {
            // FIXED discount
            discountAmount = parseFloat(coupon.discountValue);
        }

        // Ensure discount doesn't exceed order amount
        discountAmount = Math.min(discountAmount, amount);

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: Math.round(discountAmount * 100) / 100,
            description: coupon.description
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
    }
}
