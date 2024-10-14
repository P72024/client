FROM oven/bun:latest

WORKDIR /app

COPY . .

EXPOSE 8010

RUN bun install

ENTRYPOINT [ "bun", "run", "main.ts"]
