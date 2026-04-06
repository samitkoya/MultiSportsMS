# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory to /app
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend2/package*.json ./frontend2/

# Install dependencies (root and frontend)
RUN npm install
RUN cd frontend2 && npm install

# Copy the rest of the application code with proper ownership
COPY --chown=node:node . .

# Build the frontend production assets
RUN npm run build:frontend

# Set environment variables
ENV NODE_ENV=production
# Hugging Face Spaces listens on port 7860 by default
ENV PORT=7860

# Create /data directory for persistent storage and set permissions
USER root
RUN mkdir -p /data && chown -R node:node /data
USER node

# Expose the port the app runs on
EXPOSE 7860

# Start the application
CMD ["npm", "start"]
