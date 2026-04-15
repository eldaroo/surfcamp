FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV NODE_OPTIONS=--max-old-space-size=2048
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_LINK_GENERATOR_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_LINK_GENERATOR_URL=$NEXT_PUBLIC_LINK_GENERATOR_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG CACHE_BUST
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=1024
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/content ./content

RUN mkdir -p /app/.next/cache/images && chown -R nextjs:nodejs /app/.next

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health', { cache: 'no-store' }).then(async (response) => { if (!response.ok) throw new Error('bad status ' + response.status); const payload = await response.json(); if (!payload.ok) throw new Error('unhealthy payload'); }).catch((error) => { console.error(error.message); process.exit(1); })"

CMD ["sh", "-c", "mkdir -p /app/.next/cache/images && exec npm run start"]
