/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    LOBBYPMS_API_URL: process.env.LOBBYPMS_API_URL,
    LOBBYPMS_API_KEY: process.env.LOBBYPMS_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  }
}

module.exports = nextConfig 