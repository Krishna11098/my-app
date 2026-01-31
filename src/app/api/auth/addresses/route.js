import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUserFromToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        return decoded;
    } catch {
        return null;
    }
}

// GET - Fetch user's addresses
export async function GET() {
    try {
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: user.id },
            orderBy: { isDefault: 'desc' }
        });

        return NextResponse.json(addresses);
    } catch (error) {
        console.error('Get Addresses Error:', error);
        return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }
}

// POST - Add new address
export async function POST(req) {
    try {
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { street, city, state, postalCode, country, isDefault } = await req.json();

        if (!street || !city || !state || !postalCode) {
            return NextResponse.json({ error: 'All address fields are required' }, { status: 400 });
        }

        // If this is marked as default, unset other default addresses
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false }
            });
        }

        // Check if user has any addresses
        const existingCount = await prisma.address.count({ where: { userId: user.id } });

        const address = await prisma.address.create({
            data: {
                userId: user.id,
                street,
                city,
                state,
                postalCode,
                country: country || 'India',
                isDefault: isDefault || existingCount === 0 // First address is default
            }
        });

        return NextResponse.json(address, { status: 201 });
    } catch (error) {
        console.error('Add Address Error:', error);
        return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
    }
}

// PUT - Update address
export async function PUT(req) {
    try {
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, street, city, state, postalCode, country, isDefault } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.address.findFirst({
            where: { id, userId: user.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        // If setting as default, unset others
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: user.id, isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }

        const address = await prisma.address.update({
            where: { id },
            data: {
                street: street || existing.street,
                city: city || existing.city,
                state: state || existing.state,
                postalCode: postalCode || existing.postalCode,
                country: country || existing.country,
                isDefault: isDefault !== undefined ? isDefault : existing.isDefault
            }
        });

        return NextResponse.json(address);
    } catch (error) {
        console.error('Update Address Error:', error);
        return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
    }
}

// DELETE - Remove address
export async function DELETE(req) {
    try {
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.address.findFirst({
            where: { id, userId: user.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        await prisma.address.delete({ where: { id } });

        // If deleted was default, set another as default
        if (existing.isDefault) {
            const another = await prisma.address.findFirst({
                where: { userId: user.id }
            });
            if (another) {
                await prisma.address.update({
                    where: { id: another.id },
                    data: { isDefault: true }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Address Error:', error);
        return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
    }
}
