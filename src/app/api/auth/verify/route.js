import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.isVerified) {
            return NextResponse.json({ message: 'User already verified' });
        }

        if (user.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        if (user.otpExpiry < new Date()) {
            return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
        }

        // Transaction to verify user and apply credits if applicable
        await prisma.$transaction(async (tx) => {
            // 1. Mark verified
            await tx.user.update({
                where: { email },
                data: {
                    isVerified: true,
                    otp: null,
                    otpExpiry: null,
                    // Grant credits to self if they used a coupon? 
                    // Requirements: "then both of them should get 50 credits"
                },
            });

            // 2. Apply credits logic
            if (user.couponUsedAtSignup) {
                const referrerCode = user.couponUsedAtSignup;
                const referrer = await tx.user.findUnique({ where: { ownCouponCode: referrerCode } });

                if (referrer) {
                    // Credit Referrer
                    await tx.user.update({
                        where: { id: referrer.id },
                        data: { credits: { increment: 50 } }
                    });

                    // Credit New User (Self)
                    await tx.user.update({
                        where: { email }, // using email or id
                        data: { credits: { increment: 50 } }
                    });
                }
            }
        });

        return NextResponse.json({ message: 'Verification successful' });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
