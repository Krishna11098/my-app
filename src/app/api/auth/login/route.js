import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid User ID or Password.' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid User ID or Password.' }, { status: 401 });
        }

        if (!user.isVerified) {
            return NextResponse.json({ error: 'Please verify your email first', isVerified: false }, { status: 403 });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        const response = NextResponse.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

        // Set cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
