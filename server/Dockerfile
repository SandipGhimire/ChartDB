FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /usr/src/app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY package.json ./package.json
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown -R node:node /usr/src/app

USER node
EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
