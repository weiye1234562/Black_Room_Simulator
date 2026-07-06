FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source first to avoid postinstall issues
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/
COPY client/package.json client/package-lock.json client/

# Install all deps explicitly (no postinstall race condition)
RUN npm install --ignore-scripts
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY data/ data/
COPY server/index.js server/
COPY client/ client/

# Build client
RUN cd client && npx vite build

# --- Production image ---
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/server/package.json /app/server/package-lock.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/server/index.js ./server/

# Copy image assets (from host, not builder)
COPY server/百闻牌卡面图/ ./server/百闻牌卡面图/
COPY server/壁纸类图片/ ./server/壁纸类图片/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
