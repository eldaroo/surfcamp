# Brevo Email Configuration

This document explains how to configure Brevo (formerly Sendinblue) for sending booking confirmation emails.

## Required Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Brevo API Key
# Get this from: https://app.brevo.com/settings/keys/api
BREVO_API_KEY=your_brevo_api_key_here

# Template IDs for confirmation emails
# English template ID
BREVO_TEMPLATE_EN=your_english_template_id_here

# Spanish template ID
BREVO_TEMPLATE_ES=your_spanish_template_id_here
```

## Template Setup

The email templates should include the following variables (Brevo will replace these with actual data):

- `{{params.BOOKING_REFERENCE}}` - The booking reference number
- `{{params.CUSTOMER_NAME}}` - Customer's full name
- `{{params.CHECK_IN_DATE}}` - Check-in date (formatted)
- `{{params.CHECK_OUT_DATE}}` - Check-out date (formatted)
- `{{params.GUESTS}}` - Number of guests
- `{{params.ROOM_TYPE}}` - Type of room booked
- `{{params.TOTAL_AMOUNT}}` - Total booking amount
- `{{params.ACTIVITIES}}` - List of selected activities (optional)

## Template IDs

Your current template IDs are:
- English: `18ddMXo8lvfmAUVptapb4su7UzEhcqmiCVkl18.9bAjZxcXI1gI6XWeW`
- Spanish: `W2T0WhcgbFTZY.jAQ7kyF8sk2kkGsf_0DDisSZFIGIqLS.5vE9POd_4q`

**Note:** These appear to be template identifiers from Brevo. You may need to convert these to numeric template IDs. Check your Brevo dashboard under Campaign > Templates to find the numeric ID for each template.

## How It Works

1. When a booking is successfully created in LobbyPMS
2. The system sends a WhatsApp confirmation (existing functionality)
3. Then it sends an email confirmation using Brevo templates
4. The email is sent based on the user's selected locale (en/es)
5. If email sending fails, it retries up to 3 times with exponential backoff
6. Email failures don't affect the booking - they're logged but the reservation continues

## Testing

To test email sending:

1. Make a test reservation through the widget
2. Check the server logs for email sending status:
   - `📧 [BREVO] Sending booking confirmation email` - Email send initiated
   - `✅ [BREVO] Email sent successfully` - Email sent
   - `❌ [BREVO] Error sending email` - Email failed

3. Check your inbox for the confirmation email

## Troubleshooting

### Email not being sent

1. Verify `BREVO_API_KEY` is set correctly
2. Check that template IDs are numeric values
3. Look for errors in server logs
4. Verify the API key has permission to send transactional emails

### Template variables not showing

1. Ensure template variables match exactly (case-sensitive)
2. Use Brevo's template editor to preview with sample data
3. Check that all required variables are being passed from the code

## Getting Your API Key

1. Go to https://app.brevo.com
2. Navigate to Settings > SMTP & API > API Keys
3. Create a new API key or use an existing one
4. Copy the key and add it to `.env.local`

## Converting Template URLs to IDs

If your template IDs appear as long strings in the URL:

1. Go to https://app.brevo.com
2. Navigate to Campaign > Templates
3. Click on your template
4. Look for the numeric ID in the URL or template settings
5. Use that numeric ID in your environment variables

Alternatively, you can use Brevo's API to list your templates and get their IDs programmatically.
