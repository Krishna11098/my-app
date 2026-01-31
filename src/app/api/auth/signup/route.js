import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { name, email, password, role, companyName, gstin, productCategory, couponCode } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Validate Coupon Code if provided
    let validCoupon = null;
    if (couponCode) {
      const referrer = await prisma.user.findUnique({
        where: { ownCouponCode: couponCode },
      });
      if (referrer) {
        validCoupon = couponCode;
      } else {
        // Option: Fail or Ignore? Usually better to fail so user knows code was bad.
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Generate Unique Coupon Code for New User
    // Simple logic: First 4 letters of name + 4 random hex chars
    const base = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const uniqueSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    let ownCouponCode = `${base}${uniqueSuffix}`;

    // Ensure uniqueness (extremely unlikely to collide with 4 hex chars + name, but good practice)
    let isUnique = false;
    while (!isUnique) {
      const existingCode = await prisma.user.findUnique({ where: { ownCouponCode } });
      if (!existingCode) {
        isUnique = true;
      } else {
        ownCouponCode = `${base}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'CUSTOMER',
        companyName: role === 'VENDOR' ? companyName : undefined,
        gstin: role === 'VENDOR' ? gstin : undefined,
        category: role === 'VENDOR' ? productCategory : undefined,
        otp,
        otpExpiry,
        isVerified: false,
        ownCouponCode,
        couponUsedAtSignup: validCoupon,
        credits: 0, // Credits applied after verification
      },
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json({ message: 'Signup successful. Please verify OTP.', email });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
