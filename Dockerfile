FROM oven/bun:1.4.2 AS base
WORKDIR /app

FROM base AS build
COPY package.json bun.lock ./
COPY patches ./patches
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun --bun run build

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
