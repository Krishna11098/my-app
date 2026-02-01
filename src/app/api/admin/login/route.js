import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    try {
        const { username, password } = await req.json();

        // 1. Hardcoded Check for specific requirement
        if (username === 'admin' && password === 'adm123') {
            // Find or Upsert an Admin user in the DB to ensure data consistency for relations
            let adminUser = await prisma.user.findFirst({
                where: { role: 'ADMIN' }
            });

            if (!adminUser) {
                // Create a default admin user if one doesn't exist
                const passwordHash = await bcrypt.hash('adm123', 10);
                adminUser = await prisma.user.create({
                    data: {
                        email: 'admin@system.local',
                        name: 'System Administrator',
                        passwordHash,
                        role: 'ADMIN',
                        isVerified: true,
                    }
                });
            }

            const token = jwt.sign(
                { userId: adminUser.id, email: adminUser.email, role: 'ADMIN' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '1d' }
            );

            const response = NextResponse.json({
                success: true,
                user: { id: adminUser.id, name: adminUser.name, role: 'ADMIN' }
            });

            response.cookies.set('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });

            return response;
        }

        // 2. Normal check if there are other admin users
        const user = await prisma.user.findUnique({
            where: { email: username } // Allowing email as username for other admins
        });

        if (user && user.role === 'ADMIN') {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (isValid) {
                const token = jwt.sign(
                    { userId: user.id, email: user.email, role: 'ADMIN' },
                    process.env.JWT_SECRET || 'secret',
                    { expiresIn: '1d' }
                );

                const response = NextResponse.json({
                    success: true,
                    user: { id: user.id, name: user.name, role: 'ADMIN' }
                });

                response.cookies.set('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24, // 1 day
                    path: '/',
                });

                return response;
            }
        }

        return NextResponse.json({ error: 'Invalid Access Credentials' }, { status: 401 });

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json({ error: 'System error during authentication' }, { status: 500 });
    }
}
