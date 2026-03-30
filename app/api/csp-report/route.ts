import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const text = await request.text();

    // Reporting API v1 sends an array of reports
    if (contentType.includes('application/reports+json')) {
      const reports: any[] = JSON.parse(text);
      for (const report of reports) {
        console.error('🚨 [REPORTING-API]', JSON.stringify({
          type:      report.type,           // "csp-violation" | "network-error" | "certificate-error" etc.
          url:       report.url,            // page that triggered it
          age:       report.age,
          body:      report.body,           // contains blockedURL, effectiveDirective, etc.
        }, null, 2));
      }
      return new NextResponse(null, { status: 204 });
    }

    // Legacy CSP report-uri format
    const body = JSON.parse(text);
    const report = body['csp-report'] || body;
    console.error('🚨 [CSP-REPORT]', JSON.stringify({
      blockedUri:        report['blocked-uri']         || report.blockedURL,
      violatedDirective: report['violated-directive']  || report.effectiveDirective,
      documentUri:       report['document-uri']        || report.documentURL,
      sourceFile:        report['source-file']         || report.sourceFile,
      statusCode:        report['status-code'],
    }, null, 2));
  } catch {
    const text = await request.text().catch(() => '(unreadable)');
    console.error('🚨 [CSP-REPORT] raw:', text);
  }

  return new NextResponse(null, { status: 204 });
}
