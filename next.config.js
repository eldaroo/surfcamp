/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *; upgrade-insecure-requests; report-uri /api/csp-report"
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig; 
