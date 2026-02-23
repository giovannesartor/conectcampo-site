# =============================================
# ConectCampo API - Dockerfile
# =============================================
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy workspace root files
COPY package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY prisma/package.json ./prisma/

RUN npm install --legacy-peer-deps

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd prisma && npx prisma generate

# Build packages and API
RUN npx turbo run build --filter=@conectcampo/api

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/apps/api/package.json ./package.json
COPY apps/api/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

USER nestjs

EXPOSE 3001

CMD ["sh", "./entrypoint.sh"]
