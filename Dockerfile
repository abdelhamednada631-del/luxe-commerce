# ── LUXE — single-container production image ────────────────────
# Multi-stage build. The runner keeps full node_modules (no output
# tracing) so native modules (better-sqlite3, sharp) are guaranteed
# to resolve. Reliability over image size.

FROM node:20-bookworm-slim AS deps
WORKDIR /app
# Toolchain fallback in case a native prebuild is unavailable on the arch
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN groupadd -r app && useradd -r -g app app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
# Persistent volume target (attach a Railway volume at /data)
RUN mkdir -p /data && chown app:app /data
USER app
EXPOSE 3000
CMD ["npm", "start"]
