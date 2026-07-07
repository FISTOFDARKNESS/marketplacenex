import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !message) {
      return NextResponse.json({ error: 'Name and message are required' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'contactyzero.dev@gmail.com',
      subject: `[NexBlox Help] Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email || 'Not provided'}\n\nMessage:\n${message}`,
      html: `
        <h3>New Help Request</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email || 'Not provided'}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact email error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
