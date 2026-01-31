import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendResetPasswordEmail } from '@/lib/email';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal user existence
            return NextResponse.json({ message: 'If this email exists, a reset code has been sent.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // We reuse resetToken field for OTP in this flow or create a new field?
        // Schema has `resetToken` (String). I will use `resetToken` to store the OTP.

        await prisma.user.update({
            where: { email },
            data: {
                resetToken: otp,
                resetExpiry: otpExpiry,
            },
        });

        await sendResetPasswordEmail(email, otp);

        return NextResponse.json({ message: 'Reset code sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
