import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Client-side events POSTed here so they appear in Nomad server logs.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, order_id, detail } = body;
    console.log(`🖥️ [CLIENT] event=${event} order_id=${order_id}${detail ? ` detail=${JSON.stringify(detail)}` : ''}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
