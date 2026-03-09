module.exports = {
  apps: [{
    name: 'surfcamp',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/root/surfcamp',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 3000,
      LOBBYPMS_API_URL: process.env.LOBBYPMS_API_URL || 'https://api.lobbypms.com/api/v1',
      LOBBYPMS_API_KEY: process.env.LOBBYPMS_API_KEY || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      DATABASE_URL: process.env.DATABASE_URL || '',
      DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT || '',
      WETRAVEL_API_KEY: process.env.WETRAVEL_API_KEY || '',
      WETRAVEL_AUTH_URL: process.env.WETRAVEL_AUTH_URL || 'https://api.wetravel.com/v2/auth/tokens/access',
      WETRAVEL_API_URL: process.env.WETRAVEL_API_URL || 'https://api.wetravel.com/v2/payment_links',
      WETRAVEL_WEBHOOK_SECRET: process.env.WETRAVEL_WEBHOOK_SECRET || '',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '',
      DEV_RESERVE_BASE_URL: process.env.DEV_RESERVE_BASE_URL || ''
    }
  }]
};
