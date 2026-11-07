FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders only; real values are supplied at runtime.
ENV DATABASE_URL=postgres://dummy:dummy@localhost:5432/dummy \
    NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy
ARG NEXT_PUBLIC_PYTHON_BACKEND_URL
ENV NEXT_PUBLIC_PYTHON_BACKEND_URL=$NEXT_PUBLIC_PYTHON_BACKEND_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]
