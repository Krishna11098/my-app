import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    };
    await transporter.sendMail(mailOptions);
};

export const sendOrderConfirmationEmail = async (order, customer) => {
    const items = order.lines?.map(l => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${l.product?.name || 'Product'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${l.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${l.type === 'SALE' ? 'Purchase' : 'Rental'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(l.lineTotal).toLocaleString()}</td>
        </tr>
    `).join('') || '';

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: `🎉 Order Confirmed - ${order.orderNumber}`,
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #9333ea, #4f46e5); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">JOY JUNCTURE</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Order Confirmed!</p>
            </div>
            
            <div style="padding: 30px; background: white;">
                <h2 style="color: #333; margin-bottom: 20px;">Hi ${customer.name}! 👋</h2>
                <p style="color: #666; line-height: 1.6;">
                    Thank you for your order! We're excited to have you on board. Here are your order details:
                </p>
                
                <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0;"><strong>Order Number:</strong></td>
                            <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #9333ea;">${order.orderNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;"><strong>Rental Period:</strong></td>
                            <td style="padding: 8px 0; text-align: right;">${new Date(order.rentalStart).toLocaleDateString('en-IN')} - ${new Date(order.rentalEnd).toLocaleDateString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;"><strong>Status:</strong></td>
                            <td style="padding: 8px 0; text-align: right;"><span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px;">CONFIRMED</span></td>
                        </tr>
                    </table>
                </div>
                
                <h3 style="color: #333; margin-top: 30px;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666;">Item</th>
                            <th style="padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #666;">Qty</th>
                            <th style="padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #666;">Type</th>
                            <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #666;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items}
                    </tbody>
                </table>
                
                <div style="border-top: 2px solid #eee; margin-top: 20px; padding-top: 20px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 5px 0; color: #666;">Subtotal</td>
                            <td style="padding: 5px 0; text-align: right;">₹${Number(order.subtotal).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #666;">Tax (18%)</td>
                            <td style="padding: 5px 0; text-align: right;">₹${Number(order.taxAmount).toLocaleString()}</td>
                        </tr>
                        <tr style="font-size: 18px; font-weight: bold;">
                            <td style="padding: 10px 0; border-top: 2px solid #333;">Total</td>
                            <td style="padding: 10px 0; text-align: right; border-top: 2px solid #333; color: #9333ea;">₹${Number(order.totalAmount).toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}" 
                       style="display: inline-block; background: linear-gradient(135deg, #9333ea, #4f46e5); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: bold;">
                        View Order Details
                    </a>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 10px;">
                    <h4 style="color: #92400e; margin: 0 0 10px;">📦 What's Next?</h4>
                    <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                        Your items will be ready for pickup on <strong>${new Date(order.rentalStart).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>. 
                        We'll send you a reminder before the pickup date.
                    </p>
                </div>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f9f9f9;">
                <p style="margin: 0;">Questions? Reply to this email or contact us at support@joyjuncture.com</p>
                <p style="margin: 10px 0 0;">© ${new Date().getFullYear()} Joy Juncture. All rights reserved.</p>
            </div>
        </div>
        `,
    };
    await transporter.sendMail(mailOptions);
};

export const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Verification Code',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333333; text-align: center;">Verification Code</h2>
          <p style="font-size: 16px; color: #666666;">Thank you for signing up. Please use the following OTP to verify your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #999999; text-align: center;">This code will expire in 10 minutes.</p>
        </div>
      </div>
    `,
    };
    await transporter.sendMail(mailOptions);
};

export const sendResetPasswordEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Password',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333333; text-align: center;">Reset Password</h2>
          <p style="font-size: 16px; color: #666666;">You requested to reset your password. Use the code below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #E11D48;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #999999; text-align: center;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
    };
    await transporter.sendMail(mailOptions);
};
