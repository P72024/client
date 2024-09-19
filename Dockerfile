
# Use an official node base image with Bun installed
FROM oven/bun:latest

# Set working directory inside the container
WORKDIR /app

# Copy package.json and bun.lockb for faster rebuilds
COPY bun.lockb package.json ./

# Install dependencies
RUN bun install

# Copy the rest of the project files
COPY . .

# Expose the port Bun will use to serve the app
EXPOSE 3000

# Copy the entrypoint scripts

ENV preview="false"


CMD if [ "$preview" = "true" ]; then exec bun run preview; else exec bun run dev; fi

