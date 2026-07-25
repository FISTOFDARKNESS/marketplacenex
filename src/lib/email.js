import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

function otpTemplate(code, title, message) {
  const digits = code.split('').map(d => `<span class="d">${d}</span>`).join('');
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#0b0b0f;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0f;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;background:#131316;border:1px solid #26262c;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#fbbf24);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;font-weight:800;color:#1a1a1e;">N</div>
                <h1 style="color:#f5f5f5;font-size:20px;margin:16px 0 4px;">NexBlox</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;text-align:center;">
                <h2 style="color:#ffffff;font-size:18px;margin:0 0 8px;">${title}</h2>
                <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 20px;">${message}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <div style="background:#0f0f13;border:1px solid #26262c;border-radius:12px;padding:20px;text-align:center;letter-spacing:8px;">
                  ${digits}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 28px;text-align:center;">
                <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0;">Este código expira em 10 minutos. Se você não solicitou, ignore este e-mail.</p>
              </td>
            </tr>
          </table>
          <p style="color:#4b5563;font-size:12px;margin-top:16px;">© NexBlox Marketplace</p>
        </td>
      </tr>
    </table>
    <style>
      .d { display:inline-block; min-width:34px; padding:8px 4px; margin:0 3px; background:#1a1a1e; border:1px solid #2a2a30; border-radius:8px; color:#fbbf24; font-size:24px; font-weight:800; font-family:'Courier New',monospace; }
    </style>
  </body>
  </html>`;
}

export async function sendLoginAlertEmail(toEmail, endSessionToken, info, baseUrl) {
  const { browser, os, device, ip } = info;
  const link = `${baseUrl.replace(/\/$/, '')}/end-session?token=${endSessionToken}`;
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#0b0b0f;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0f;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#131316;border:1px solid #26262c;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px;text-align:center;">
                <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#fbbf24);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;font-weight:800;color:#1a1a1e;">N</div>
                <h1 style="color:#f5f5f5;font-size:20px;margin:16px 0 4px;">New login to NexBlox</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 20px;">
                  A new device just signed in to your account. If this was you, you can ignore this email.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;border:1px solid #26262c;border-radius:12px;padding:16px;margin-bottom:20px;">
                  <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px;">Device: <span style="color:#e5e7eb;font-weight:600;">${device}</span></td></tr>
                  <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px;">Browser: <span style="color:#e5e7eb;">${browser}</span></td></tr>
                  <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px;">OS: <span style="color:#e5e7eb;">${os}</span></td></tr>
                  <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px;">IP: <span style="color:#e5e7eb;">${ip}</span></td></tr>
                  <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px;">Time: <span style="color:#e5e7eb;">${new Date().toLocaleString()}</span></td></tr>
                </table>
                <a href="${link}" style="display:block;background:#ef4444;color:#ffffff;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;text-align:center;">
                  End this session
                </a>
                <p style="color:#6b7280;font-size:12px;line-height:1.5;margin:16px 0 0;">
                  If you didn't request this login, click the button above to end the session. This link expires in 7 days.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #26262c;text-align:center;">
                <p style="color:#4b5563;font-size:11px;margin:0;">NexBlox &bull; Buy &amp; Sell Roblox Limiteds</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: 'New login to your NexBlox account',
    html,
  });
}

export async function sendOtpEmail(email, code, purpose = 'gmail-verify') {
  const config = {
    'gmail-verify': {
      title: 'Verify your Gmail address',
      message: 'Use the code below to link your Gmail address to your NexBlox account.',
    },
    'session-revoke': {
      title: 'Confirm device sign out',
      message: 'Use the code below to confirm signing out a session from your NexBlox account.',
    },
  };
  const c = config[purpose] || config['gmail-verify'];
  const subjectMap = {
    'gmail-verify': 'Your verification code — NexBlox',
    'session-revoke': 'Confirm sign out — NexBlox',
  };
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: subjectMap[purpose] || subjectMap['gmail-verify'],
    html: otpTemplate(code, c.title, c.message),
  });
}
