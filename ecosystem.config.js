module.exports = {
  apps: [{
    name: 'surfcamp',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/root/surfcamp',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,

      // LobbyPMS API Configuration
      LOBBYPMS_API_URL: 'https://api.lobbypms.com/api/v1',
      LOBBYPMS_API_KEY: 'JNjeoLeXxTHFQSwUPQCgwBnCZktRVv7pfQ48uz2tyoNu6K9dW6D2US1cN9Mu',

      // Stripe Configuration
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',

      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: 'https://uuthdwwusjyyteylohte.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dGhkd3d1c2p5eXRleWxvaHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYwNDA0MCwiZXhwIjoyMDczMTgwMDQwfQ.XZpA6VK2bzhSfIDWe3sZXoHQX2DKSFNaV1sykVd0KfA',

      // Direct connection to PRIMARY Supabase database (IMPORTANTE - LLENAR ESTO)
      DATABASE_URL_DIRECT: 'postgresql://postgres:TU_PASSWORD_AQUI@db.uuthdwwusjyyteylohte.supabase.co:5432/postgres',

      // WeTravel Webhook
      WETRAVEL_WEBHOOK_SECRET: 'whsec_6R/1HdALC0sq7DY/I2oTnCkdGsafwiqQ',

      // Dev URL (si es producción, tal vez no necesites esto)
      DEV_RESERVE_BASE_URL: 'https://891f66652b25.ngrok-free.app/'
    }
  }]
};
