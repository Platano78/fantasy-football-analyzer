# Local Gemini Advanced Bridge Server - Docker Configuration
# Multi-stage build for optimal production image

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Remove development files
RUN rm -rf node_modules/.cache \
    && rm -rf .git \
    && rm -rf *.test.js \
    && rm -rf coverage

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gemini -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=gemini:nodejs /app ./

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data && \
    chown -R gemini:nodejs /app/logs /app/data

# Switch to non-root user
USER gemini

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
        if (res.statusCode === 200) { \
            process.exit(0); \
        } else { \
            process.exit(1); \
        } \
    }).on('error', () => { \
        process.exit(1); \
    })"

# Set environment variables
ENV NODE_ENV=production \
    BRIDGE_PORT=3001 \
    BRIDGE_HOST=0.0.0.0 \
    LOG_LEVEL=info

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# Labels for better container management
LABEL maintainer="Fantasy Football Analyzer Team" \
      version="1.0.0" \
      description="Local Gemini Advanced Bridge Server" \
      org.opencontainers.image.title="Gemini Advanced Bridge Server" \
      org.opencontainers.image.description="Production-ready bridge server for Fantasy Football AI coaching" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="Fantasy Football Analyzer" \
      org.opencontainers.image.licenses="MIT"