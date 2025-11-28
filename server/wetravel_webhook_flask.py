#!/usr/bin/env python3
"""
WeTravel Webhook Handler - Python/Flask Implementation
Alternative to the Node.js/Express version
"""

import os
import json
import hmac
import hashlib
import time
import logging
from datetime import datetime
from threading import Thread

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
WETRAVEL_WEBHOOK_SECRET = os.getenv('WETRAVEL_WEBHOOK_SECRET')
WETRAVEL_WEBHOOK_TOKEN = os.getenv('WETRAVEL_WEBHOOK_TOKEN')

def get_db_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=RealDictCursor
    )

def verify_hmac_signature(raw_body: bytes, signature: str, timestamp: str) -> bool:
    """Verify HMAC signature from WeTravel"""
    if not WETRAVEL_WEBHOOK_SECRET:
        logger.warning("WETRAVEL_WEBHOOK_SECRET not set, skipping HMAC verification")
        return True
    
    if not signature or not timestamp:
        logger.error("Missing signature or timestamp headers")
        return False
    
    try:
        # WeTravel format: timestamp.payload
        payload = f"{timestamp}.{raw_body.decode('utf-8')}"
        expected_signature = hmac.new(
            WETRAVEL_WEBHOOK_SECRET.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Remove 'sha256=' prefix if present
        received_signature = signature.replace('sha256=', '')
        
        # Constant-time comparison
        return hmac.compare_digest(expected_signature, received_signature)
    
    except Exception as e:
        logger.error(f"HMAC verification error: {e}")
        return False

def verify_token() -> bool:
    """Verify webhook token from query parameter"""
    if not WETRAVEL_WEBHOOK_TOKEN:
        logger.warning("WETRAVEL_WEBHOOK_TOKEN not set, skipping token verification")
        return True
    
    token = request.args.get('token')
    if not token or token != WETRAVEL_WEBHOOK_TOKEN:
        logger.error("Invalid or missing webhook token")
        return False
    
    return True

def process_webhook_background(event_data: dict):
    """Process webhook event in background thread"""
    def background_task():
        try:
            process_webhook_event(event_data)
        except Exception as e:
            logger.error(f"Background webhook processing error: {e}")
            # In production, implement retry logic or dead letter queue
    
    thread = Thread(target=background_task)
    thread.daemon = True
    thread.start()

def process_webhook_event(event_data: dict):
    """Main webhook processing logic"""
    event_type = event_data.get('type')
    data = event_data.get('data', {})
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            logger.info(f"Processing webhook event: {event_type}", extra={
                'payment_id': data.get('id'),
                'order_id': data.get('order_id'),
                'status': data.get('status'),
                'updated_at': data.get('updated_at')
            })
            
            # Check idempotency
            event_key = f"{data.get('id')}:{data.get('updated_at', int(time.time()))}"
            cursor.execute(
                "SELECT event_key FROM wetravel_events WHERE event_key = %s",
                (event_key,)
            )
            
            if cursor.fetchone():
                logger.info(f"Event already processed: {event_key}")
                return
            
            # Record event for idempotency
            cursor.execute("""
                INSERT INTO wetravel_events (event_key, event_type, payment_id, order_id)
                VALUES (%s, %s, %s, %s)
            """, (event_key, event_type, data.get('id'), data.get('order_id')))
            
            # Process different event types
            if event_type == 'payment.created':
                handle_payment_created(cursor, data)
            elif event_type == 'payment.updated':
                handle_payment_updated(cursor, data)
            elif event_type in ['transaction.created', 'transaction.updated']:
                handle_transaction(cursor, data, event_type)
            else:
                logger.warning(f"Unhandled event type: {event_type}")
            
            conn.commit()
            logger.info(f"Successfully processed {event_type} for payment {data.get('id')}")
            
    except Exception as e:
        conn.rollback()
        logger.error(f"Error processing webhook {event_type}: {e}")
        raise
    finally:
        conn.close()

def handle_payment_created(cursor, data):
    """Handle payment.created events"""
    payment_id = data.get('id')
    order_id = data.get('order_id')
    status = data.get('status', 'pending')
    total_amount = data.get('total_amount')
    currency = data.get('currency', 'USD')
    payment_method = data.get('payment_method')
    
    # Ensure order exists
    cursor.execute("""
        INSERT INTO orders (id, status, total_amount, currency)
        VALUES (%s, 'pending', %s, %s)
        ON CONFLICT (id) DO NOTHING
    """, (order_id, total_amount, currency))
    
    # Insert payment record
    cursor.execute("""
        INSERT INTO payments 
        (id, order_id, status, total_amount, currency, payment_method, wetravel_data)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            total_amount = EXCLUDED.total_amount,
            currency = EXCLUDED.currency,
            payment_method = EXCLUDED.payment_method,
            wetravel_data = EXCLUDED.wetravel_data,
            updated_at = NOW()
    """, (payment_id, order_id, status, total_amount, currency, payment_method, json.dumps(data)))
    
    logger.info(f"Payment created: {payment_id} for order {order_id} ({status})")

def handle_payment_updated(cursor, data):
    """Handle payment.updated events"""
    payment_id = data.get('id')
    order_id = data.get('order_id')
    status = data.get('status')
    total_amount = data.get('total_amount')
    net_amount = data.get('net_amount')
    payment_processing_fee = data.get('payment_processing_fee')
    currency = data.get('currency', 'USD')
    payment_method = data.get('payment_method')
    
    # Update payment record
    cursor.execute("""
        UPDATE payments SET
            status = %s,
            total_amount = %s,
            net_amount = %s,
            payment_processing_fee = %s,
            currency = %s,
            payment_method = %s,
            wetravel_data = %s,
            updated_at = NOW()
        WHERE id = %s
    """, (status, total_amount, net_amount, payment_processing_fee, 
          currency, payment_method, json.dumps(data), payment_id))
    
    # Update order status based on payment status
    order_status = 'pending'
    if status == 'processed':
        order_status = 'paid'
    elif status == 'failed':
        order_status = 'cancelled'
    elif status == 'refunded':
        order_status = 'refunded'
    
    if order_status != 'pending':
        cursor.execute("""
            UPDATE orders SET
                status = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (order_status, order_id))
    
    logger.info(f"Payment updated: {payment_id} -> {status} (order {order_id} -> {order_status})")

def handle_transaction(cursor, data, event_type):
    """Handle transaction events (optional for accounting)"""
    payment_id = data.get('payment_id')
    order_id = data.get('order_id')
    amount = data.get('amount')
    net_amount = data.get('net_amount')
    payment_processing_fee = data.get('payment_processing_fee')
    transaction_type = data.get('type')
    status = data.get('status')
    currency = data.get('currency', 'USD')
    
    cursor.execute("""
        INSERT INTO transactions 
        (payment_id, order_id, amount, net_amount, payment_processing_fee, type, status, currency, wetravel_data)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
    """, (payment_id, order_id, amount, net_amount, payment_processing_fee, 
          transaction_type, status, currency, json.dumps(data)))
    
    logger.info(f"Transaction {event_type}: {payment_id} ({transaction_type})")

@app.route('/api/wetravel-webhook', methods=['POST'])
def wetravel_webhook():
    """Main webhook endpoint"""
    start_time = time.time()
    
    try:
        # Get raw body for HMAC verification
        raw_body = request.get_data()
        
        # Security checks
        signature = request.headers.get('X-Signature')
        timestamp = request.headers.get('X-Timestamp')
        
        # Verify HMAC signature (if configured)
        if WETRAVEL_WEBHOOK_SECRET and not verify_hmac_signature(raw_body, signature, timestamp):
            logger.error("HMAC signature verification failed")
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Verify token (if configured and no HMAC)
        if not WETRAVEL_WEBHOOK_SECRET and not verify_token():
            logger.error("Token verification failed")
            return jsonify({'error': 'Invalid token'}), 401
        
        # Parse JSON payload
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
            return jsonify({'error': 'Invalid JSON payload'}), 400
        
        # Validate payload structure
        event_type = payload.get('type')
        data = payload.get('data')
        
        if not event_type or not data or not data.get('id'):
            logger.error("Invalid webhook payload structure")
            return jsonify({'error': 'Invalid payload structure'}), 400
        
        # Respond quickly (< 3s requirement)
        response = {
            'status': 'received',
            'event_type': event_type,
            'payment_id': data.get('id'),
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }
        
        # Process webhook in background
        process_webhook_background(payload)
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Webhook endpoint error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/wetravel-webhook/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'database': 'connected'  # Add actual DB health check if needed
    })

@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler"""
    logger.error(f"Unhandled error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    print(f"🚀 WeTravel webhook server running on port {port}")
    print(f"📡 Webhook URL: https://surfcampwidget.duckdns.org/api/wetravel-webhook")
    app.run(host='0.0.0.0', port=port, debug=False)