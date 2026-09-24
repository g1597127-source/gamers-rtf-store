FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV CI=true

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm check && pnpm build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared

EXPOSE 10000

CMD ["sh", "-c", "pnpm drizzle-kit migrate && pnpm start"]
