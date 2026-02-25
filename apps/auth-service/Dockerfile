FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/auth-service/package.json ./apps/auth-service/
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @fintech/auth-service build

# Production image - minimal
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/auth-service/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3001 9464
USER node
CMD ["node", "dist/server.js"]