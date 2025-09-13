#!/usr/bin/env node
// Trigger Real WeTravel payment.created Webhook
// This creates actual payment links which should trigger webhooks

const fetch = require('node-fetch');

// WeTravel API configuration
const WETRAVEL_API_URL = process.env.WETRAVEL_API_URL || 'https://api.wetravel.com/v1';
const WETRAVEL_API_TOKEN = process.env.WETRAVEL_API_TOKEN;

if (!WETRAVEL_API_TOKEN) {
  console.error('❌ WETRAVEL_API_TOKEN not set');
  process.exit(1);
}

// Function to create payment link (should trigger payment.created webhook)
async function createPaymentLink(testNumber) {
  const payload = {
    data: {
      trip: {
        title: `Test Webhook Trigger ${testNumber}`,
        start_date: "2024-03-15",
        end_date: "2024-03-16", 
        currency: "USD",
        participant_fees: "all"
      },
      pricing: {
        price: 1, // $1 minimum for testing
        payment_plan: {
          allow_auto_payment: false,
          allow_partial_payment: false,
          deposit: 0,
          installments: [
            { 
              price: 1, // $1 test payment
              days_before_departure: 1
            }
          ]
        }
      },
      metadata: {
        test_purpose: "webhook_trigger",
        test_number: testNumber,
        created_at: new Date().toISOString()
      }
    }
  };

  try {
    console.log(`🔗 Creating payment link ${testNumber}...`);
    
    const response = await fetch(`${WETRAVEL_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WETRAVEL_API_TOKEN}`,
        'User-Agent': 'SurfCamp-Webhook-Test/1.0'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(result)}`);
    }

    console.log(`✅ Payment link ${testNumber} created successfully`);
    console.log(`   Payment ID: ${result.payment_id || result.id}`);
    console.log(`   Payment URL: ${result.payment_url}`);
    console.log(`   Expected webhook: payment.created should be sent to your endpoint`);
    
    return result;

  } catch (error) {
    console.error(`❌ Failed to create payment link ${testNumber}:`, error.message);
    return null;
  }
}

// Function to monitor webhook events
async function monitorWebhooks(duration = 30) {
  console.log(`\n👀 Monitoring webhooks for ${duration} seconds...`);
  console.log('   Check your webhook logs and database for incoming events');
  
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = duration - elapsed;
    
    if (remaining <= 0) {
      clearInterval(interval);
      console.log('\n⏰ Monitoring period ended');
      return;
    }
    
    process.stdout.write(`\r   Time remaining: ${remaining}s`);
  }, 1000);
}

// Main execution
async function main() {
  console.log('🎯 TRIGGERING REAL WETRAVEL WEBHOOKS');
  console.log('====================================');
  console.log(`API URL: ${WETRAVEL_API_URL}`);
  console.log(`Webhook URL: https://surfcampwidget.duckdns.org/api/wetravel-webhook`);
  console.log('');

  // Create multiple payment links to trigger webhooks
  const results = [];
  
  for (let i = 1; i <= 3; i++) {
    const result = await createPaymentLink(i);
    if (result) {
      results.push(result);
    }
    
    // Wait between requests to avoid rate limiting
    if (i < 3) {
      console.log('   Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n📊 Summary: Created ${results.length} payment links`);
  
  if (results.length > 0) {
    console.log('\n🔍 Payment IDs to watch for in webhooks:');
    results.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.payment_id || result.id}`);
    });
    
    // Monitor for incoming webhooks
    await monitorWebhooks(30);
    
    console.log('\n✅ Process completed!');
    console.log('\nNext steps:');
    console.log('1. Check your webhook server logs');
    console.log('2. Query your database for new payment records');
    console.log('3. Verify payment.created events were processed');
    
    console.log('\nSQL to check:');
    console.log('SELECT * FROM wetravel_events ORDER BY processed_at DESC LIMIT 5;');
    console.log('SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;');
  } else {
    console.log('\n❌ No payment links created successfully');
    console.log('Check your WETRAVEL_API_TOKEN and API permissions');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createPaymentLink, monitorWebhooks };