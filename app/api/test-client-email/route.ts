import { NextResponse } from 'next/server';

export async function GET() {
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailPass) {
    return NextResponse.json({ success: false, error: 'GMAIL_APP_PASSWORD not set' });
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: 'darioegea@gmail.com', pass: gmailPass },
    });

    await transporter.sendMail({
      from: '"Zeneidas Surf Garden" <darioegea@gmail.com>',
      to: 'darioegea@gmail.com',
      subject: 'Welcome to Zeneidas Surf Garden, Dario! 🌊',
      html: '<h1>Test email from Zeneidas Surf Garden</h1><p>If you got this, Gmail SMTP is working!</p>',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, code: err.code });
  }
}
