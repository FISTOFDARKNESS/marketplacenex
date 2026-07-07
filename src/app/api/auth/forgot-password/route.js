import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { verifyRecaptcha } from '@/lib/recaptcha';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key';

export async function POST(req) {
  try {
    const ip = getIP(req);
    const limitCheck = rateLimit(ip, 3, 60000); // 3 reset requests per minute per IP
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, recaptchaToken } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const isValid = await verifyRecaptcha(recaptchaToken);
    if (!isValid) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Generate a temporary reset token (expires in 15 minutes)
    const token = jwt.sign(
      { id: user.id, email: user.email, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    if (process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" style="width:100%;max-width:560px;margin:40px auto;background:#131313;border-radius:16px;border:1px solid #262626;">
    <tr>
      <td style="padding:40px 36px 24px;text-align:center;">
        <table role="presentation" style="width:48px;height:48px;margin:0 auto 20px;border:1px solid #EAC847;border-radius:12px;">
          <tr>
            <td style="text-align:center;color:#EAC847;font-size:22px;font-weight:bold;">N</td>
          </tr>
        </table>
        <h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0 0 8px;font-family:Arial,sans-serif;">Reset your password</h1>
        <p style="color:#9A9A9A;font-size:14px;line-height:1.6;margin:0 0 28px;">
          We received a request to reset your NexBlox password. Click the button below to set a new one.
        </p>
        <a href="${resetLink}" style="display:inline-block;background:#EAC847;color:#1A1600;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;">
          Reset password
        </a>
        <p style="color:#5A5A5A;font-size:12px;margin:28px 0 0;line-height:1.5;">
          This link expires in <b style="color:#EAC847;">15 minutes</b>.<br>
          If you didn't request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 36px;border-top:1px solid #262626;text-align:center;">
        <p style="color:#5A5A5A;font-size:11px;margin:0;">NexBlox &bull; Buy &amp; Sell Roblox Limiteds</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@nexblox.com',
        to: user.email,
        subject: 'Reset your NexBlox Password',
        text: `Hello,\n\nPlease click the following link to reset your password. This link is valid for 15 minutes:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
        html: htmlEmail,
      });
      
      console.log(`Password reset email sent to: ${user.email}`);
    } else {
      console.log('\n=======================================');
      console.log('PASSWORD RESET LINK GENERATED (DEV MODE):');
      console.log(resetLink);
      console.log('=======================================\n');
    }

    // Include resetLink in response only when not in production, to make manual testing convenient.
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({
      success: true,
      message: 'Reset link generated',
      ...(isDev ? { debugLink: resetLink } : {}),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
