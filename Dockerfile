FROM node:21-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build
CMD ["pnpm", "start"]
