import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: false,
    });
    pool.on('error', (err) => console.error('[DB] Pool error:', err.message));
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const p = getPool();
  const client = await p.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: any[]): Promise<number> {
  const p = getPool();
  const client = await p.connect();
  try {
    const result = await client.query(sql, params);
    return result.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrderById(id: string | number) {
  return queryOne<{
    id: string;
    status: string;
    booking_data: any;
    lobbypms_reservation_id: string | null;
    lobbypms_data: any;
    customer_name: string | null;
    customer_email: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, status, booking_data, lobbypms_reservation_id, lobbypms_data,
            customer_name, customer_email, created_at, updated_at
     FROM orders WHERE id = $1`,
    [id]
  );
}

export async function insertOrder(data: {
  id: string | number;
  status?: string;
  total_amount?: number;
  currency?: string;
  customer_name?: string;
  customer_email?: string;
  booking_data?: any;
  payment_intent_id?: string;
}) {
  return queryOne(
    `INSERT INTO orders (id, status, total_amount, currency, customer_name, customer_email, booking_data, payment_intent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [
      data.id,
      data.status ?? 'pending',
      data.total_amount ?? 0,
      data.currency ?? 'USD',
      data.customer_name ?? null,
      data.customer_email ?? null,
      data.booking_data ? JSON.stringify(data.booking_data) : null,
      data.payment_intent_id ?? null,
    ]
  );
}

export async function updateOrder(id: string | number, data: {
  status?: string;
  lobbypms_reservation_id?: string;
  lobbypms_data?: any;
  booking_data?: any;
}) {
  const sets: string[] = [];
  const params: any[] = [];
  let i = 1;

  if (data.status !== undefined) { sets.push(`status = $${i++}`); params.push(data.status); }
  if (data.lobbypms_reservation_id !== undefined) { sets.push(`lobbypms_reservation_id = $${i++}`); params.push(data.lobbypms_reservation_id); }
  if (data.lobbypms_data !== undefined) { sets.push(`lobbypms_data = $${i++}`); params.push(JSON.stringify(data.lobbypms_data)); }
  if (data.booking_data !== undefined) { sets.push(`booking_data = $${i++}`); params.push(JSON.stringify(data.booking_data)); }

  if (sets.length === 0) return 0;
  params.push(id);
  return execute(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${i}`, params);
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPaymentByOrderId(orderId: string | number) {
  return queryOne<{
    id: string;
    order_id: string;
    status: string;
    wetravel_data: any;
    wetravel_order_id: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, order_id, status, wetravel_data, wetravel_order_id, created_at, updated_at
     FROM payments WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );
}

export async function getPaymentById(id: string | number) {
  return queryOne<{
    id: string;
    order_id: string;
    status: string;
    wetravel_data: any;
    wetravel_order_id: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, order_id, status, wetravel_data, wetravel_order_id, created_at, updated_at
     FROM payments WHERE id = $1`,
    [id]
  );
}

export async function insertPayment(data: {
  id: string | number;
  order_id: string | number;
  status?: string;
  total_amount?: number;
  net_amount?: number;
  payment_processing_fee?: number;
  currency?: string;
  payment_method?: string;
  wetravel_data?: any;
  wetravel_order_id?: string;
}) {
  return queryOne(
    `INSERT INTO payments (id, order_id, status, total_amount, net_amount, payment_processing_fee,
                           currency, payment_method, wetravel_data, wetravel_order_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [
      data.id,
      data.order_id,
      data.status ?? 'pending',
      data.total_amount ?? 0,
      data.net_amount ?? null,
      data.payment_processing_fee ?? null,
      data.currency ?? 'USD',
      data.payment_method ?? null,
      data.wetravel_data ? JSON.stringify(data.wetravel_data) : null,
      data.wetravel_order_id ?? null,
    ]
  );
}

export async function updatePayment(id: string | number, data: {
  status?: string;
  wetravel_data?: any;
  wetravel_order_id?: string;
  updated_at?: string;
}) {
  const sets: string[] = [];
  const params: any[] = [];
  let i = 1;

  if (data.status !== undefined) { sets.push(`status = $${i++}`); params.push(data.status); }
  if (data.wetravel_data !== undefined) { sets.push(`wetravel_data = $${i++}`); params.push(JSON.stringify(data.wetravel_data)); }
  if (data.wetravel_order_id !== undefined) { sets.push(`wetravel_order_id = $${i++}`); params.push(data.wetravel_order_id); }
  if (data.updated_at !== undefined) { sets.push(`updated_at = $${i++}`); params.push(data.updated_at); }

  if (sets.length === 0) return 0;
  params.push(id);
  return execute(`UPDATE payments SET ${sets.join(', ')} WHERE id = $${i}`, params);
}

export async function findPaymentByWetravelData(field: string, value: string) {
  return queryOne<{ id: string; order_id: string; status: string; wetravel_data: any; wetravel_order_id: string | null }>(
    `SELECT id, order_id, status, wetravel_data, wetravel_order_id
     FROM payments WHERE wetravel_data @> $1::jsonb LIMIT 1`,
    [JSON.stringify({ [field]: value })]
  );
}

export async function findPaymentByField(field: string, value: string) {
  return queryOne<{ id: string; order_id: string; status: string; wetravel_data: any; wetravel_order_id: string | null }>(
    `SELECT id, order_id, status, wetravel_data, wetravel_order_id
     FROM payments WHERE ${field} = $1 LIMIT 1`,
    [value]
  );
}

export async function getRecentPendingPayments(minutes = 5) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  return query<{ id: string; order_id: string; status: string; wetravel_data: any; wetravel_order_id: string | null; created_at: string }>(
    `SELECT id, order_id, status, wetravel_data, wetravel_order_id, created_at
     FROM payments WHERE status IN ('pending','booking_created') AND created_at >= $1
     ORDER BY created_at DESC LIMIT 3`,
    [since]
  );
}

export async function getRecentPayments(limit = 5) {
  return query(
    `SELECT id, order_id, status, wetravel_data, wetravel_order_id, created_at, updated_at
     FROM payments ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
}

// ─── WeTravel Events ──────────────────────────────────────────────────────────

export async function getWetravelEvent(eventKey: string) {
  return queryOne<{ event_key: string }>(
    `SELECT event_key FROM wetravel_events WHERE event_key = $1`,
    [eventKey]
  );
}

export async function insertWetravelEvent(data: {
  event_key: string;
  event_type: string;
  payment_id?: string | null;
  order_id?: string | null;
}) {
  return execute(
    `INSERT INTO wetravel_events (event_key, event_type, payment_id, order_id)
     VALUES ($1,$2,$3,$4) ON CONFLICT (event_key) DO NOTHING`,
    [data.event_key, data.event_type, data.payment_id ?? null, data.order_id ?? null]
  );
}

export async function updateWetravelEvents(where: {
  event_type?: string;
  event_key_like?: string;
  payment_id_null?: boolean;
}, data: { payment_id?: string; order_id?: string }) {
  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;

  const sets: string[] = [];
  if (data.payment_id !== undefined) { sets.push(`payment_id = $${i++}`); params.push(data.payment_id); }
  if (data.order_id !== undefined) { sets.push(`order_id = $${i++}`); params.push(data.order_id); }
  if (sets.length === 0) return 0;

  if (where.event_type) { conditions.push(`event_type = $${i++}`); params.push(where.event_type); }
  if (where.event_key_like) { conditions.push(`event_key LIKE $${i++}`); params.push(where.event_key_like); }
  if (where.payment_id_null) conditions.push(`payment_id IS NULL`);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return execute(`UPDATE wetravel_events SET ${sets.join(', ')} ${whereClause}`, params);
}

export async function updateWetravelEventByKey(eventKey: string, data: { payment_id?: string; order_id?: string }) {
  const sets: string[] = [];
  const params: any[] = [];
  let i = 1;
  if (data.payment_id !== undefined) { sets.push(`payment_id = $${i++}`); params.push(data.payment_id); }
  if (data.order_id !== undefined) { sets.push(`order_id = $${i++}`); params.push(data.order_id); }
  if (sets.length === 0) return 0;
  params.push(eventKey);
  return execute(`UPDATE wetravel_events SET ${sets.join(', ')} WHERE event_key = $${i}`, params);
}

export async function getWetravelEvents(filter?: { order_id?: string; event_type?: string }) {
  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;
  if (filter?.order_id) { conditions.push(`order_id = $${i++}`); params.push(filter.order_id); }
  if (filter?.event_type) { conditions.push(`event_type = $${i++}`); params.push(filter.event_type); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return query(`SELECT * FROM wetravel_events ${where} ORDER BY processed_at DESC LIMIT 50`, params);
}
