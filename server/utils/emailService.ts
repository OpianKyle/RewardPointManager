import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

export function formatPointsAssignmentEmail(
  customerName: string,
  points: number,
  description: string,
  currentTier: string
): { text: string; html: string } {
  const text = `
    Dear ${customerName},

    ${points} points have been assigned to your account.
    Reason: ${description}

    Your current tier is: ${currentTier}

    Thank you for your business!
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Points Assignment Notification</h2>
      <p>Dear ${customerName},</p>
      <p><strong>${points}</strong> points have been assigned to your account.</p>
      <p><strong>Reason:</strong> ${description}</p>
      <p><strong>Your current tier:</strong> ${currentTier}</p>
      <br/>
      <p>Thank you for your business!</p>
    </div>
  `;

  return { text, html };
}

export function formatAdminNotificationEmail(
  customerName: string,
  points: number,
  description: string,
  adminName: string
): { text: string; html: string } {
  const text = `
    Hello ${adminName},

    Points Assignment Notification:
    Customer: ${customerName}
    Points: ${points}
    Reason: ${description}
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Points Assignment Notification</h2>
      <p>Hello ${adminName},</p>
      <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #0070f3;">
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Points:</strong> ${points}</p>
        <p><strong>Reason:</strong> ${description}</p>
      </div>
    </div>
  `;

  return { text, html };
}
