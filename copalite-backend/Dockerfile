FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
RUN apk add --no-cache git
RUN addgroup -g 1001 app && adduser -D -u 1001 -G app app
WORKDIR /app
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json .
COPY --from=builder --chown=app:app /app/migrations ./migrations
RUN mkdir -p artifacts && chown app:app artifacts
USER app
EXPOSE 3000
CMD ["node", "dist/main.js"]
