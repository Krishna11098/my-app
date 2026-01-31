import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUserFromToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return { id: decoded.userId, ...decoded };
    } catch {
        return null;
    }
}

// GET - Fetch current user's profile
export async function GET() {
    try {
        const tokenUser = await getUserFromToken();
        if (!tokenUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: tokenUser.id },
            select: {
                id: true,
                email: true,
                name: true,
                companyName: true,
                gstin: true,
                category: true,
                role: true,
                credits: true,
                ownCouponCode: true,
                profilePhoto: true,
                companyLogo: true,
                bio: true,
                phone: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                        quotations: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// PUT - Update user's profile
export async function PUT(req) {
    try {
        const tokenUser = await getUserFromToken();
        if (!tokenUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { name, companyName, gstin, category, bio, phone, profilePhoto, companyLogo } = data;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (companyName !== undefined) updateData.companyName = companyName;
        if (gstin !== undefined) updateData.gstin = gstin;
        if (category !== undefined) updateData.category = category;
        if (bio !== undefined) updateData.bio = bio;
        if (phone !== undefined) updateData.phone = phone;
        if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
        if (companyLogo !== undefined) updateData.companyLogo = companyLogo;

        const user = await prisma.user.update({
            where: { id: tokenUser.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                companyName: true,
                gstin: true,
                category: true,
                role: true,
                credits: true,
                ownCouponCode: true,
                profilePhoto: true,
                companyLogo: true,
                bio: true,
                phone: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                        quotations: true
                    }
                }
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
