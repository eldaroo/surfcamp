/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
  },
  transpilePackages: ['framer-motion'],
  outputFileTracingIgnores: [
    '**/node_modules/**',
    '**/.git/**',
    '**/.next/cache/**',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *"
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig; 