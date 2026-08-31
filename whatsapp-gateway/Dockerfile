FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose standard port
ENV PORT=8080
EXPOSE 8080

# Run the gateway
CMD ["npm", "start"]
