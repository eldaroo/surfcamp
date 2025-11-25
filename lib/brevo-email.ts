import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY || '';

// Template IDs for confirmation emails
const TEMPLATES = {
  en: parseInt(process.env.BREVO_TEMPLATE_EN || ''), // English template
  es: parseInt(process.env.BREVO_TEMPLATE_ES || '')  // Spanish template
};

interface BookingEmailParams {
  recipientEmail: string;
  recipientName: string;
  locale: 'en' | 'es';
  bookingData: {
    bookingReference: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    roomTypeName?: string;
    activities?: Array<{
      name: string;
      quantity?: number;
      classCount?: number;
    }>;
    totalAmount?: number;
  };
}

export async function sendBookingConfirmationEmail({
  recipientEmail,
  recipientName,
  locale,
  bookingData
}: BookingEmailParams): Promise<boolean> {
  try {
    console.log('📧 [BREVO] Sending booking confirmation email:', {
      email: recipientEmail,
      locale,
      template: TEMPLATES[locale]
    });

    // Select template based on locale
    const templateId = TEMPLATES[locale] || TEMPLATES.es;

    if (!templateId) {
      console.error('❌ [BREVO] No template ID configured for locale:', locale);
      return false;
    }

    // Format dates for display
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Prepare template parameters
    const params = {
      BOOKING_REFERENCE: bookingData.bookingReference,
      CUSTOMER_NAME: recipientName,
      CHECK_IN_DATE: formatDate(bookingData.checkIn),
      CHECK_OUT_DATE: formatDate(bookingData.checkOut),
      GUESTS: bookingData.guests.toString(),
      ROOM_TYPE: bookingData.roomTypeName || '',
      TOTAL_AMOUNT: bookingData.totalAmount?.toString() || '0',
      // Add activities if present
      ...(bookingData.activities && bookingData.activities.length > 0 && {
        ACTIVITIES: bookingData.activities.map(act =>
          `${act.name}${act.classCount ? ` (${act.classCount} classes)` : ''}${act.quantity ? ` x${act.quantity}` : ''}`
        ).join(', ')
      })
    };

    // Create email request
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.params = params;

    // Send email
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('✅ [BREVO] Email sent successfully:', {
      messageId: response.messageId,
      recipient: recipientEmail
    });

    return true;
  } catch (error: any) {
    console.error('❌ [BREVO] Error sending email:', {
      error: error.message,
      response: error.response?.body
    });
    return false;
  }
}

export async function sendBookingConfirmationEmailWithRetry(
  params: BookingEmailParams,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📧 [BREVO] Email send attempt ${attempt}/${maxRetries}`);

    const success = await sendBookingConfirmationEmail(params);

    if (success) {
      return true;
    }

    if (attempt < maxRetries) {
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ [BREVO] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`❌ [BREVO] Failed to send email after ${maxRetries} attempts`);
  return false;
}
