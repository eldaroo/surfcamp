const ADMIN_EMAIL = 'darioegea@gmail.com';

// ─── Client confirmation email ────────────────────────────────────────────────

interface ClientConfirmationParams {
  clientFirstName: string;
  clientEmail: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  depositAmount: number;
  remainingBalance: number;
}

export async function sendClientConfirmationEmail(params: ClientConfirmationParams): Promise<boolean> {
  const { clientFirstName, clientEmail, checkIn, checkOut, totalAmount, depositAmount, remainingBalance } = params;

  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailPass) {
    console.error('❌ [GMAIL] GMAIL_APP_PASSWORD not configured');
    return false;
  }

  const formatDate = (d: string) => {
    const parts = d.split('T')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:arial,helvetica,sans-serif;font-size:16px;color:#3b3f44;line-height:1.5">

  <!-- View in browser -->
  <div style="text-align:center;padding:5px 30px;font-size:12px;color:#858588">
  </div>

  <!-- Header / Logo -->
  <div style="background:#ffffff;text-align:center;padding:20px 30px">
    <img src="https://img.mailinblue.com/6729432/images/content_library/original/656752a46309a364926d7a0d.png" width="200" alt="Zeneidas Surf Garden" style="display:inline-block">
  </div>

  <!-- Banner -->
  <div style="max-width:600px;margin:0 auto;padding:20px 0;text-align:center">
    <h1 style="margin:0 0 8px;font-size:32px;color:#1F2D3D;font-family:arial,helvetica,sans-serif">Welcome to Zeneidas Surf Garden!</h1>
    <p style="margin:0 0 16px">We are excited to share this experience with you :)</p>
    <img src="https://img.mailinblue.com/6729432/images/content_library/original/6567533f44dbda5b2eb773d1.jpg"
      style="width:100%;max-width:570px;border-radius:58px;display:block;margin:0 auto">
  </div>

  <!-- Body -->
  <div style="max-width:600px;margin:0 auto;padding:20px 0">

    <h3 style="font-size:24px;color:#1F2D3D;margin:0 0 12px">Hi ${clientFirstName}, hope you are doing well!<br>I'm Daro from the Zeneidas Surf Garden family!</h3>

    <p style="margin:0 0 16px">
      We are thrilled to welcome you to our house in Santa Teresa, Costa Rica! We are looking forward to hosting you for this fantastic experience filled with surf adventures and relaxation in this surfing paradise.<br><br>
      <strong>Arrival:</strong> ${formatDate(checkIn)}<br>
      <strong>Departure:</strong> ${formatDate(checkOut)}
    </p>

    <hr style="border:none;border-top:3px double #4A4A4A;margin:30px 0">

    <p style="margin:0 0 16px">
      <strong>Investment for the experience:</strong> US$${totalAmount}<br>
      <strong>Deposit:</strong> US$${depositAmount}<br>
      <strong>Remaining Balance:</strong> US$${remainingBalance}
    </p>
    <p style="margin:0 0 16px"><em>Kindly note that <strong>the remaining payment will be settled in cash upon your arrival.</strong></em></p>

    <hr style="border:none;border-top:3px solid #4A4A4A;margin:30px 0">

    <p style="margin:0 0 16px"><strong>Rest assured, you don't need to worry about a thing! Just inform us of your arrival date and time, and from there, all you have to do is enjoy to the fullest!</strong></p>

    <!-- Quote -->
    <div style="text-align:center;border:2px solid #fbd878;border-radius:21px;padding:12px 5px;margin:15px auto;width:72%;box-sizing:border-box">
      <p style="margin:0;font-style:italic"><strong>"Let the waves carry you where the light can not"</strong></p>
      <p style="margin:0"><em>– Mohit Kaushik</em></p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background:#eff2f7;text-align:center;padding:20px;max-width:600px;margin:0 auto">
    <p style="margin:0 0 12px">
      <strong>Any Questions or Doubts?</strong><br>
      <strong>Check <a href="https://santateresasurfcamp.com" style="color:#fbd878;text-decoration:underline">our website</a> and don't hesitate to <a href="https://wa.link/cm8ykz" style="color:#fbd878;text-decoration:underline">chat with us</a>!</strong>
    </p>
  </div>

</body>
</html>`;

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: ADMIN_EMAIL, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"Zeneidas Surf Garden" <${ADMIN_EMAIL}>`,
      to: clientEmail,
      subject: `Welcome to Zeneidas Surf Garden, ${clientFirstName}! 🌊`,
      html,
    });

    console.log('✅ [GMAIL] Client confirmation email sent to', clientEmail);
    return true;
  } catch (error: any) {
    console.error('❌ [GMAIL] Client confirmation email error:', error.message);
    return false;
  }
}

interface AdminNotificationParams {
  bookingReference: string;
  clientFullName: string;
  clientEmail: string;
  clientPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomTypeName?: string;
  totalAmount?: number;
  depositAmount?: number;
  remainingBalance?: number;
  locale: 'en' | 'es';
  iceBathParticipants?: Array<{ name: string; iceBathSessions: number }>;
  surfParticipants?: Array<{ name: string; surfClasses: number }>;
  activities?: Array<{ name: string; participants: string[]; quantity?: number }>;
}

export async function sendAdminNotificationEmail(params: AdminNotificationParams): Promise<boolean> {
  const {
    bookingReference, clientFullName, clientEmail, clientPhone,
    checkIn, checkOut, guests, roomTypeName, totalAmount, depositAmount,
    remainingBalance, locale, iceBathParticipants, surfParticipants, activities
  } = params;

  const formatDate = (d: string) => {
    const parts = d.split('T')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      .toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap"><b>${label}</b></td><td style="padding:4px 0">${value}</td></tr>`;

  const section = (title: string, color: string, body: string) => `
    <div style="margin:24px 0;border-left:4px solid ${color};padding-left:16px">
      <h2 style="margin:0 0 12px;font-size:16px;color:${color}">${title}</h2>
      ${body}
    </div>`;

  // ── Booking summary ──────────────────────────────────────────────────────
  const summaryRows = [
    row('Referencia', bookingReference),
    row('Cliente', clientFullName),
    row('Email', clientEmail),
    row('Teléfono', clientPhone),
    row('Check-in', formatDate(checkIn)),
    row('Check-out', formatDate(checkOut)),
    row('Huéspedes', String(guests)),
    ...(roomTypeName ? [row('Alojamiento', roomTypeName)] : []),
    ...(totalAmount ? [row('Total', `$${totalAmount}`)] : []),
    ...(depositAmount ? [row('Depósito WeTravel', `$${depositAmount}`)] : []),
    ...(remainingBalance ? [row('Pendiente', `$${remainingBalance}`)] : []),
  ].join('');

  const bookingSummary = section('🔔 Nueva Reserva', '#2563eb',
    `<table style="border-collapse:collapse">${summaryRows}</table>`);

  // ── Ice Bath instructor ──────────────────────────────────────────────────
  let iceBathSection = '';
  if (iceBathParticipants && iceBathParticipants.length > 0) {
    const list = iceBathParticipants.map(p =>
      `<li>${p.name}: <b>${p.iceBathSessions} ${p.iceBathSessions === 1 ? 'sesión' : 'sesiones'}</b></li>`
    ).join('');
    iceBathSection = section('🧊 Para el Instructor de Baño de Hielo', '#0891b2',
      `<table style="border-collapse:collapse">
        ${row('Cliente', clientFullName)}
        ${row('Teléfono', clientPhone)}
        ${row('Llegada', formatDate(checkIn))}
        ${row('Salida', formatDate(checkOut))}
      </table>
      <p style="margin:8px 0 4px"><b>Participantes:</b></p>
      <ul style="margin:0;padding-left:20px">${list}</ul>
      <p style="margin:8px 0 0;color:#666;font-style:italic">Coordiná horarios directamente con el cliente.</p>`
    );
  }

  // ── Surf instructor ──────────────────────────────────────────────────────
  let surfSection = '';
  if (surfParticipants && surfParticipants.length > 0) {
    const list = surfParticipants.map(p =>
      `<li>${p.name}: <b>${p.surfClasses} ${p.surfClasses === 1 ? 'clase' : 'clases'}</b></li>`
    ).join('');
    surfSection = section('🏄 Para el Instructor de Surf', '#059669',
      `<table style="border-collapse:collapse">
        ${row('Cliente', clientFullName)}
        ${row('Teléfono', clientPhone)}
        ${row('Llegada', formatDate(checkIn))}
        ${row('Salida', formatDate(checkOut))}
      </table>
      <p style="margin:8px 0 4px"><b>Participantes:</b></p>
      <ul style="margin:0;padding-left:20px">${list}</ul>
      <p style="margin:8px 0 0;color:#666;font-style:italic">Coordiná horarios directamente con el cliente.</p>`
    );
  }

  // ── Activities list (fallback when no instructor breakdown) ──────────────
  let activitiesSection = '';
  if (activities && activities.length > 0 && !iceBathParticipants?.length && !surfParticipants?.length) {
    const list = activities.map(a => {
      const qty = a.quantity ? ` x${a.quantity}` : '';
      return `<li>${a.name}${qty} — ${a.participants.join(', ')}</li>`;
    }).join('');
    activitiesSection = section('🎯 Actividades', '#7c3aed',
      `<ul style="margin:0;padding-left:20px">${list}</ul>`);
  }

  // ── Client message (Dario's welcome) ────────────────────────────────────
  const isEn = locale === 'en';
  const clientMsgText = isEn
    ? `Hi! 🙌 This is Dario — welcome to Zeneidas Surf Garden.\n\nThe instructors for the activities you booked will reach out today to coordinate schedules.\n\nFor check-in or accommodation questions contact Zeneidas reception: +506 6176 2653`
    : `Hola! 🙌 Soy Dario, bienvenidos a Zeneidas Surf Garden.\n\nLos profesores de las actividades que eligieron se van a estar comunicando durante el día para coordinar horarios.\n\nPara dudas sobre check-in o alojamiento, contacten recepción de Zeneidas: +506 6176 2653`;

  const clientSection = section('💬 Mensaje para enviar al cliente', '#d97706',
    `<p style="margin:0;color:#555">Enviá este mensaje a <b>${clientFullName}</b> (${clientPhone}):</p>
     <pre style="background:#f9f5eb;border:1px solid #e5d5a0;border-radius:6px;padding:12px;margin:8px 0;white-space:pre-wrap;font-family:inherit;font-size:14px">${clientMsgText}</pre>`
  );

  const html = `
    <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#333;max-width:700px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;border-bottom:2px solid #eee;padding-bottom:12px;margin-bottom:0">
        Reserva Confirmada — ${bookingReference}
      </h1>
      ${bookingSummary}
      ${iceBathSection}
      ${surfSection}
      ${activitiesSection}
      ${clientSection}
    </body></html>`;

  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailPass) {
    console.error('❌ [GMAIL] GMAIL_APP_PASSWORD not configured');
    throw new Error('GMAIL_APP_PASSWORD not configured');
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ADMIN_EMAIL,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"Zeneidas Surf Garden" <${ADMIN_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🔔 Nueva Reserva ${bookingReference} — ${clientFullName}`,
      html,
    });

    console.log('✅ [GMAIL] Admin notification email sent to', ADMIN_EMAIL);
    return true;
  } catch (error: any) {
    console.error('❌ [GMAIL] Admin email exception:', error.message);
    throw error;
  }
}

// Template IDs for confirmation emails
const TEMPLATES = {
  en: parseInt(process.env.BREVO_TEMPLATE_EN || '0'),
  es: parseInt(process.env.BREVO_TEMPLATE_ES || '0')
};

// List IDs for booking confirmation automation by locale
const BREVO_BOOKING_LISTS = {
  en: 5, // Surfcamp participants English
  es: 6  // Surfcamp participantes Español
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

    // Format dates for display in dd/mm/yyyy format
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
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

/**
 * Add contact to Brevo list with attributes to trigger automation
 * This approach uses the Contacts API to add/update a contact with custom attributes,
 * which can trigger an automation workflow instead of sending a template email directly.
 */
export async function addContactToBrevoList({
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

    // Select list based on locale
    const listId = BREVO_BOOKING_LISTS[locale] || BREVO_BOOKING_LISTS.es;

    console.log('📧 [BREVO] Adding contact to list with attributes:', {
      email: recipientEmail,
      locale,
      listId: listId
    });

    // Format dates for display in dd/mm/yyyy format
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Prepare contact attributes matching template variable names
    // These will be available as {{ contact.FIRSTNAME }}, {{ contact.FROM }}, etc.
    const attributes = {
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

    console.log('📧 [BREVO] Contact attributes:', JSON.stringify(attributes, null, 2));

    // Add/update contact using Brevo Contacts API
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email: recipientEmail,
        attributes: attributes,
        listIds: [listId],
        updateEnabled: true // Update if contact already exists
      })
    });

    console.log('📧 [BREVO] Request body:', JSON.stringify({
      email: recipientEmail,
      attributes: attributes,
      listIds: [listId],
      updateEnabled: true
    }, null, 2));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [BREVO] Error adding contact to list:', {
        status: response.status,
        error: errorData
      });
      return false;
    }

    const result = await response.json();

    console.log('✅ [BREVO] Contact added to list successfully:', {
      id: result.id,
      email: recipientEmail,
      listId: listId,
      locale: locale
    });

    return true;
  } catch (error: any) {
    console.error('❌ [BREVO] Error adding contact to list:', {
      error: error.message
    });
    return false;
  }
}

export async function addContactToBrevoListWithRetry(
  params: BookingEmailParams,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📧 [BREVO] Contact add attempt ${attempt}/${maxRetries}`);

    const success = await addContactToBrevoList(params);

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

  console.error(`❌ [BREVO] Failed to add contact after ${maxRetries} attempts`);
  return false;
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
