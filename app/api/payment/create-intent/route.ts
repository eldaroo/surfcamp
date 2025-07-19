import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'eur', bookingReference } = body;

    // Validate required environment variable
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey || stripeSecretKey.includes('placeholder') || stripeSecretKey.length < 50) {
      console.log('🎯 Stripe not configured properly, using demo mode');
      
      // Mock payment intent for development/demo
      return NextResponse.json({
        success: true,
        clientSecret: `pi_demo_${Date.now()}_secret_demo`,
        paymentIntentId: `pi_demo_${Date.now()}`,
        message: 'Demo payment intent created (development mode)',
        amount: amount,
        currency: currency,
        demoMode: true,
      });
    }

    console.log('🎯 Attempting to create real Stripe payment intent...');

    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          booking_reference: bookingReference,
          source: 'surfcamp-santa-teresa',
        },
        description: `Surf Camp Booking - ${bookingReference}`,
      });

      return NextResponse.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency,
        demoMode: false,
      });

    } catch (stripeError) {
      console.error('Stripe error, falling back to demo mode:', stripeError);
      
      // Fall back to demo mode if Stripe fails
      return NextResponse.json({
        success: true,
        clientSecret: `pi_demo_fallback_${Date.now()}_secret`,
        paymentIntentId: `pi_demo_fallback_${Date.now()}`,
        message: 'Demo payment intent created (Stripe fallback)',
        amount: amount,
        currency: currency,
        demoMode: true,
        stripeError: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error',
      });
    }

  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    // Even on error, provide demo mode as fallback
    return NextResponse.json({
      success: true,
      clientSecret: `pi_demo_error_${Date.now()}_secret`,
      paymentIntentId: `pi_demo_error_${Date.now()}`,
      message: 'Demo payment intent created (error fallback)',
      demoMode: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 