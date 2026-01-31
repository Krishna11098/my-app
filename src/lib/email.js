import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

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
