import { Pool } from 'pg';

// Connection pool for DIRECT connection to PRIMARY database (no replicas)
// This bypasses Supabase's connection pooler and reads directly from the primary
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    // Use direct connection string (port 5432) instead of pooler (port 6543)
    // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

    if (!connectionString) {
      // Return null if no connection string - will fallback to Supabase client
      return null;
    }

    pool = new Pool({
      connectionString,
      max: 10, // Maximum number of connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('🔌 [DB-DIRECT] Connection pool created for PRIMARY database');
  }

  return pool;
}

// Get payment by order_id from PRIMARY database
export async function getPaymentByOrderId(orderId: string | number) {
  const pool = getPool();

  // If no pool available (no DATABASE_URL_DIRECT), return null to trigger fallback
  if (!pool) {
    return null;
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT id, order_id, status, wetravel_data, created_at, updated_at
       FROM payments
       WHERE order_id = $1
       LIMIT 1`,
      [orderId]
    );

    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Get order by id from PRIMARY database
export async function getOrderById(orderId: string | number) {
  const pool = getPool();

  // If no pool available (no DATABASE_URL_DIRECT), return null to trigger fallback
  if (!pool) {
    return null;
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT id, status, booking_data, lobbypms_reservation_id, created_at, updated_at
       FROM orders
       WHERE id = $1
       LIMIT 1`,
      [orderId]
    );

    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Close the pool (call this on server shutdown)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 [DB-DIRECT] Connection pool closed');
  }
}
