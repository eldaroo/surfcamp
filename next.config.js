/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://tilda.ws'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://tilda.ws https://*.tilda.ws"
          }
        ],
      },
    ];
  },
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig; 