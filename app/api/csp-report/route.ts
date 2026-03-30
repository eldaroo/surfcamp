import { NextRequest, NextResponse } from 'next/server';

// In-memory ring buffer — last 50 reports, survives until container restarts
const reports: Array<{ ts: string; type: string; data: any }> = [];
const MAX = 50;

function store(type: string, data: any) {
  reports.unshift({ ts: new Date().toISOString(), type, data });
  if (reports.length > MAX) reports.pop();
  console.error(`🚨 [${type}]`, JSON.stringify(data, null, 2));
}

// POST — browsers send reports here
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const text = await request.text();

    if (contentType.includes('application/reports+json')) {
      const list: any[] = JSON.parse(text);
      for (const r of list) {
        store('REPORTING-API', { type: r.type, url: r.url, age: r.age, body: r.body });
      }
      return new NextResponse(null, { status: 204 });
    }

    const body = JSON.parse(text);
    const r = body['csp-report'] || body;
    store('CSP-REPORT', {
      blockedUri:        r['blocked-uri']        || r.blockedURL,
      violatedDirective: r['violated-directive'] || r.effectiveDirective,
      documentUri:       r['document-uri']       || r.documentURL,
      sourceFile:        r['source-file']        || r.sourceFile,
    });
  } catch {
    const raw = await request.text().catch(() => '(unreadable)');
    store('RAW', { raw });
  }

  return new NextResponse(null, { status: 204 });
}

// GET — view collected reports in the browser
export async function GET() {
  if (reports.length === 0) {
    return NextResponse.json({ message: 'No reports yet. Browse the site normally and refresh this page.' });
  }
  return NextResponse.json(reports, { status: 200 });
}
