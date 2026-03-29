FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/study.db

EXPOSE 3001

CMD ["node", "dist-server/index.js"]
