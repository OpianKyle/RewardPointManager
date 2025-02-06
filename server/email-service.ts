import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

const apiInstance = new TransactionalEmailsApi();

// Initialize API key using the correct authentication method
apiInstance.authentications = {
  'api-key': {
    type: 'apiKey',
    in: 'header',
    name: 'api-key',
    apiKey: process.env.BREVO_API_KEY
  }
};

interface EmailParams {
  to: { email: string; name: string };
  subject: string;
  htmlContent: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    sendSmtpEmail.sender = { name: "Points System", email: "points@yourdomain.com" };
    sendSmtpEmail.to = [params.to];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generatePointsUpdateEmail(params: {
  customerName: string;
  points: number;
  newTotal: number;
  tier: string;
  description: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Points Update Notification</h2>
      <p>Hello ${params.customerName},</p>
      <p>Your points have been updated!</p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Points Added:</strong> ${params.points.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>New Total:</strong> ${params.newTotal.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Current Tier:</strong> ${params.tier}</p>
        <p style="margin: 5px 0;"><strong>Reason:</strong> ${params.description}</p>
      </div>

      <p>Thank you for being a valued member!</p>
    </div>
  `;
}