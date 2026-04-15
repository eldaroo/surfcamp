import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const uptimeSeconds = Math.floor(process.uptime());

  return NextResponse.json(
    {
      ok: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      startedAt: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
      uptimeSeconds,
      nodeVersion: process.version,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
