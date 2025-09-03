FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

USER nodejs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "apps/api/dist/index.js"]
