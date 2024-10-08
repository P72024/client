FROM oven/bun:latest

WORKDIR /app

COPY . .


ENTRYPOINT [ "bun", "run", "main.ts"]