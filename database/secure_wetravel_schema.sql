-- WeTravel Webhook Integration Schema - SECURE VERSION
-- PostgreSQL Database Schema with RLS (Row Level Security)

-- Create tables first
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

CREATE TABLE IF NOT EXISTS wetravel_events (
    event_key VARCHAR(255) PRIMARY KEY, -- payment_id:updated_at or x-event-id
    event_type VARCHAR(100) NOT NULL,
    payment_id BIGINT,
    order_id BIGINT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Performance indexes
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

-- 🔒 SECURITY: Enable RLS on sensitive tables
-- This blocks ALL external access by default
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wetravel_events   ENABLE ROW LEVEL SECURITY;

-- 🔒 SECURITY: Revoke public permissions (cleanup)
-- Ensures no accidental access granted elsewhere
REVOKE ALL ON orders, payments, transactions, wetravel_events FROM PUBLIC;

-- 🔒 SECURITY: No policies = No external access
-- The service_role (backend) bypasses RLS and can operate normally
-- Frontend with anon/authenticated roles cannot read/write anything

-- 📊 OPTIONAL: Secure view for frontend queries (if needed later)
-- Only expose what's safe for frontend consumption
CREATE OR REPLACE VIEW order_status_public AS
SELECT 
    id as order_id,
    status,
    total_amount,
    currency,
    created_at
FROM orders
WHERE status IN ('paid', 'cancelled', 'refunded'); -- Only show final states

-- 🔒 SECURITY: RLS policy for the public view (example)
-- This view could have limited SELECT policies if needed
-- ALTER TABLE order_status_public ENABLE ROW LEVEL SECURITY;

-- 📝 SECURITY NOTES:
-- 1. Backend uses service_role (bypasses RLS) → Full access ✅
-- 2. Frontend uses anon/authenticated → NO access ✅
-- 3. Webhook validation happens in backend before DB writes ✅
-- 4. All external requests blocked by RLS ✅
-- 5. Optional: Create specific views + policies for safe frontend reads

COMMENT ON TABLE orders IS 'Main booking orders - RLS enabled, backend-only access';
COMMENT ON TABLE payments IS 'WeTravel payment records - RLS enabled, backend-only access';
COMMENT ON TABLE wetravel_events IS 'Webhook deduplication - RLS enabled, backend-only access';
COMMENT ON TABLE transactions IS 'Accounting records - RLS enabled, backend-only access';