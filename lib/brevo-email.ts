// Template IDs for confirmation emails
const TEMPLATES = {
  en: parseInt(process.env.BREVO_TEMPLATE_EN || '0'),
  es: parseInt(process.env.BREVO_TEMPLATE_ES || '0')
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
    depositAmount?: number;
    remainingBalance?: number;
  };
}

export async function sendBookingConfirmationEmail({
  recipientEmail,
  recipientName,
  locale,
  bookingData
}: BookingEmailParams): Promise<boolean> {
  try {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      console.error('❌ [BREVO] BREVO_API_KEY not configured');
      return false;
    }

    console.log('📧 [BREVO] Sending booking confirmation email:', {
      email: recipientEmail,
      locale,
      template: TEMPLATES[locale]
    });

    // Select template based on locale
    const templateId = TEMPLATES[locale] || TEMPLATES.es;

    if (!templateId || templateId === 0) {
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

    // Prepare template parameters matching Brevo template variable names
    const params = {
      // Match template variables: {{ params.FIRSTNAME }}, {{ params.FROM }}, etc.
      FIRSTNAME: recipientName.split(' ')[0], // First name only
      FROM: formatDate(bookingData.checkIn),
      TO: formatDate(bookingData.checkOut),
      TOTALAMOUNT: bookingData.totalAmount?.toString() || '0',
      DEPOSIT: bookingData.depositAmount?.toString() || '0',
      REMAINING: bookingData.remainingBalance?.toString() || '0',

      // Additional fields
      BOOKING_REFERENCE: bookingData.bookingReference,
      CUSTOMER_NAME: recipientName,
      GUESTS: bookingData.guests.toString(),
      ROOM_TYPE: bookingData.roomTypeName || '',

      // Add activities if present
      ...(bookingData.activities && bookingData.activities.length > 0 && {
        ACTIVITIES: bookingData.activities.map(act =>
          `${act.name}${act.classCount ? ` (${act.classCount} classes)` : ''}${act.quantity ? ` x${act.quantity}` : ''}`
        ).join(', ')
      })
    };

    console.log('📧 [BREVO] Template parameters being sent:', JSON.stringify(params, null, 2));

    // Send email using Brevo REST API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        to: [{ email: recipientEmail, name: recipientName }],
        templateId: templateId,
        params: params
      })
    });

    console.log('📧 [BREVO] Request body:', JSON.stringify({
      to: [{ email: recipientEmail, name: recipientName }],
      templateId: templateId,
      params: params
    }, null, 2));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [BREVO] Error sending email:', {
        status: response.status,
        error: errorData
      });
      return false;
    }

    const result = await response.json();

    console.log('✅ [BREVO] Email sent successfully:', {
      messageId: result.messageId,
      recipient: recipientEmail
    });

    return true;
  } catch (error: any) {
    console.error('❌ [BREVO] Error sending email:', {
      error: error.message
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
