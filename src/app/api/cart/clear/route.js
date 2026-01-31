import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        // Find and delete all draft quotations for this user
        await prisma.quotation.deleteMany({
            where: { customerId: userId, status: 'DRAFT' }
        });

        return NextResponse.json({ success: true, message: 'Cart cleared' });
    } catch (e) {
        console.error("Cart Clear Error:", e);
        return NextResponse.json({ error: 'Error clearing cart' }, { status: 500 });
    }
}
