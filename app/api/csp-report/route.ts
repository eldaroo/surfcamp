import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const report = body['csp-report'] || body;

    console.error('🚨 [CSP-REPORT]', JSON.stringify({
      blockedUri:       report['blocked-uri']        || report.blockedURL,
      violatedDirective: report['violated-directive'] || report.effectiveDirective,
      documentUri:      report['document-uri']        || report.documentURL,
      sourceFile:       report['source-file']         || report.sourceFile,
      statusCode:       report['status-code'],
      referrer:         report['referrer'],
    }, null, 2));
  } catch {
    // some browsers send plain text
    const text = await request.text().catch(() => '(unreadable)');
    console.error('🚨 [CSP-REPORT] raw:', text);
  }

  return new NextResponse(null, { status: 204 });
}
