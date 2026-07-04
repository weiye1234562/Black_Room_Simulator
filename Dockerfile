FROM node:20-alpine AS builder

WORKDIR /app

# Install root deps
COPY package.json package-lock.json ./
RUN npm install

# Build client
COPY client/ client/
COPY data/ data/
COPY server/ server/
RUN cd client && npm install && npx vite build

# --- Production image ---
FROM node:20-alpine

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/server/package.json /app/server/package-lock.json ./server/
COPY --from=builder /app/client/dist /app/client/dist
COPY --from=builder /app/data /app/data
COPY --from=builder /app/server/index.js /app/server/

# Also copy image assets
COPY server/百闻牌卡面图/ /app/server/百闻牌卡面图/
COPY server/壁纸类图片/ /app/server/壁纸类图片/

# Install server deps
RUN cd server && npm install --omit=dev

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
