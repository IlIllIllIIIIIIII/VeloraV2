FROM oven/bun:1.4.2 AS base
WORKDIR /app

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=base /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
COPY patches ./patches
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN node node_modules/@sveltejs/kit/svelte-kit.js sync
RUN set -eu; \
    if [ -d static/books ]; then \
        mv static/books /tmp/velora-books; \
    fi; \
    node node_modules/vite/bin/vite.js build; \
    if [ -d /tmp/velora-books ]; then \
        mkdir -p build/client; \
        mv /tmp/velora-books build/client/books; \
    fi

FROM base AS production-dependencies
COPY package.json bun.lock ./
COPY patches ./patches
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=8080 \
    PROTOCOL_HEADER=x-forwarded-proto
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/glass ./glass
COPY --from=build /app/poly ./poly
COPY --from=build /app/prism ./prism
COPY package.json index.js ./
USER bun
EXPOSE 8080
CMD ["bun", "index.js"]