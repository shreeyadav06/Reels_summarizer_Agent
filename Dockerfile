FROM node:18

# Install Python and dependencies
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg
RUN pip3 install --no-cache-dir yt-dlp instaloader --break-system-packages

# Set working directory
WORKDIR /app

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy application code (including the server directory)
COPY . .

# Expose port and start
EXPOSE 3005
CMD ["npm", "start"]
