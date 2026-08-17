# =============================================================================
# Stage 1: Build Next.js/Nextra app
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# =============================================================================
# Stage 2: Runtime image
# =============================================================================
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/proxy.js ./proxy.js
COPY --from=builder /app/mdx-components.js ./mdx-components.js

EXPOSE 3000

CMD ["npm", "run", "start"]
