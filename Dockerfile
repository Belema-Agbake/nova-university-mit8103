FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY scripts/provision-lecturer.ts ./scripts/provision-lecturer.ts
CMD ["npx", "tsx", "scripts/provision-lecturer.ts"]
