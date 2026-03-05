FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @agentura/worker build
CMD ["node", "apps/worker/dist/index.js"]
