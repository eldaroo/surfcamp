-- WeTravel Webhook Integration Schema
-- PostgreSQL Database Schema

-- Orders table (main booking data)
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY, -- WeTravel order_id
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, cancelled, refunded
    total_amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    booking_data JSONB, -- store full booking details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (WeTravel payment records)
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY, -- WeTravel payment_id
    order_id BIGINT NOT NULL REFERENCES orders(id),
    status VARCHAR(50) NOT NULL, -- pending, processed, failed, refunded, disputed
    total_amount INTEGER NOT NULL, -- in cents
    net_amount INTEGER, -- amount after fees
    payment_processing_fee INTEGER, -- WeTravel fees
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50), -- card, bank_transfer, etc
    wetravel_data JSONB, -- store full WeTravel payment data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event deduplication table (idempotency)
CREATE TABLE IF NOT EXISTS wetravel_events (
    event_key VARCHAR(255) PRIMARY KEY, -- payment_id:updated_at or x-event-id
    event_type VARCHAR(100) NOT NULL,
    payment_id BIGINT,
    order_id BIGINT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Transactions table for accounting reconciliation
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    payment_id BIGINT REFERENCES payments(id),
    order_id BIGINT REFERENCES orders(id),
    amount INTEGER NOT NULL, -- in cents
    net_amount INTEGER,
    payment_processing_fee INTEGER,
    type VARCHAR(50), -- payment, refund, chargeback, etc
    status VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    wetravel_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_wetravel_events_type ON wetravel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);

-- Update trigger for orders.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();