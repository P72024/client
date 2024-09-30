FROM oven/bun:latest

WORKDIR /app/

COPY . .

ENTRYPOINT [ "bun", "main.ts" ]