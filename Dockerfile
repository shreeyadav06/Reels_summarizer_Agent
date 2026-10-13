FROM node:22-bookworm-slim

# Install Python and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir yt-dlp instaloader --break-system-packages

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application code
COPY . .

# Ensure app directory permissions for node user
RUN chown -R node:node /app

# Switch to unprivileged user
USER node

# Expose port and start (3005 default, 10000 Render standard)
ENV PORT=3005
EXPOSE 3005 10000
CMD ["npm", "start"]

