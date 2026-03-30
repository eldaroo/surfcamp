/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256],
  },
  async headers() {
    const reportingEndpoint = 'https://santateresasurfcamp.com/api/csp-report';
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors *; upgrade-insecure-requests; report-uri ${reportingEndpoint}; report-to default`
          },
          {
            // Reporting API v1 — captures CSP, cert errors, NEL, deprecations
            key: 'Report-To',
            value: JSON.stringify({
              group: 'default',
              max_age: 86400,
              endpoints: [{ url: reportingEndpoint }],
              include_subdomains: true,
            }),
          },
          {
            // Network Error Logging — captures TLS/cert failures on every resource
            key: 'NEL',
            value: JSON.stringify({
              report_to: 'default',
              max_age: 86400,
              include_subdomains: true,
              failure_fraction: 1.0,
            }),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 
