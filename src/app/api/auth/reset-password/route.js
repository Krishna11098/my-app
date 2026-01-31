import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        if (user.resetToken !== otp) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        if (!user.resetExpiry || user.resetExpiry < new Date()) {
            return NextResponse.json({ error: 'Code expired' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: {
                passwordHash,
                resetToken: null,
                resetExpiry: null,
            },
        });

        return NextResponse.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
