#!/bin/bash

# Local Gemini Advanced Bridge Server - Startup Script
# Production-ready startup with health checks and monitoring

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_NAME="gemini-bridge"
PID_FILE="/tmp/${SERVER_NAME}.pid"
LOG_DIR="${SCRIPT_DIR}/logs"
NODE_ENV="${NODE_ENV:-development}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p "${LOG_DIR}"
    mkdir -p "${SCRIPT_DIR}/data"
    mkdir -p "/tmp/gemini-bridge"
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18.0.0 or higher."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_VERSION="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        error "Node.js version $NODE_VERSION is not supported. Please install version $REQUIRED_VERSION or higher."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm."
    fi
    
    log "✅ All dependencies satisfied"
}

# Install node modules if needed
install_dependencies() {
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        log "Installing Node.js dependencies..."
        npm install --production
        log "✅ Dependencies installed"
    else
        info "Dependencies are up to date"
    fi
}

# Check if server is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            warn "Server is already running with PID $PID"
            return 0
        else
            warn "Removing stale PID file"
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Health check function
health_check() {
    local max_attempts=30
    local attempt=1
    local port="${BRIDGE_PORT:-3001}"
    
    log "Performing health check..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:${port}/health" > /dev/null 2>&1; then
            log "✅ Health check passed"
            return 0
        fi
        
        info "Health check attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Start the server
start_server() {
    log "Starting Gemini Advanced Bridge Server..."
    
    # Export environment variables
    export NODE_ENV="$NODE_ENV"
    export LOG_LEVEL="${LOG_LEVEL:-info}"
    
    # Start server based on environment
    case "$NODE_ENV" in
        "production")
            log "Starting in production mode with PM2..."
            if command -v pm2 &> /dev/null; then
                pm2 start ecosystem.config.js --env production
                pm2 save
            else
                warn "PM2 not found, starting with Node.js directly"
                nohup node server.js > "${LOG_DIR}/server.log" 2>&1 &
                echo $! > "$PID_FILE"
            fi
            ;;
        "development")
            log "Starting in development mode..."
            if command -v nodemon &> /dev/null; then
                nodemon server.js
            else
                warn "Nodemon not found, starting with Node.js directly"
                node server.js
            fi
            ;;
        *)
            log "Starting in $NODE_ENV mode..."
            node server.js &
            echo $! > "$PID_FILE"
            ;;
    esac
    
    # Give the server time to start
    sleep 5
    
    # Perform health check
    if [ "$NODE_ENV" != "development" ]; then
        health_check
    fi
    
    log "🚀 Gemini Advanced Bridge Server started successfully!"
    
    # Display connection info
    local port="${BRIDGE_PORT:-3001}"
    local host="${BRIDGE_HOST:-localhost}"
    
    echo ""
    echo "🌐 Server Information:"
    echo "   HTTP Server: http://${host}:${port}"
    echo "   WebSocket:   ws://${host}:${port}/ws"
    echo "   Health:      http://${host}:${port}/health"
    echo "   Status:      http://${host}:${port}/api/status"
    echo "   Environment: ${NODE_ENV}"
    echo ""
}

# Stop the server
stop_server() {
    log "Stopping Gemini Advanced Bridge Server..."
    
    if [ "$NODE_ENV" = "production" ] && command -v pm2 &> /dev/null; then
        pm2 stop gemini-bridge-server 2>/dev/null || true
        pm2 delete gemini-bridge-server 2>/dev/null || true
    elif [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            rm -f "$PID_FILE"
            log "✅ Server stopped"
        else
            warn "Server was not running"
            rm -f "$PID_FILE"
        fi
    else
        warn "No PID file found, attempting to kill by process name"
        pkill -f "node server.js" || true
    fi
}

# Restart the server
restart_server() {
    log "Restarting Gemini Advanced Bridge Server..."
    stop_server
    sleep 2
    start_server
}

# Display server status
show_status() {
    local port="${BRIDGE_PORT:-3001}"
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log "✅ Server is running (PID: $PID)"
            
            # Try to get detailed status from API
            if curl -f -s "http://localhost:${port}/api/status" > /dev/null 2>&1; then
                info "Server API is responding"
                curl -s "http://localhost:${port}/api/status" | grep -o '"uptime":[0-9]*' | cut -d':' -f2 | xargs -I {} echo "   Uptime: {} seconds"
            else
                warn "Server API is not responding"
            fi
        else
            warn "PID file exists but process is not running"
            rm -f "$PID_FILE"
        fi
    else
        info "Server is not running (no PID file)"
    fi
}

# Display logs
show_logs() {
    local lines="${1:-50}"
    
    if [ -f "${LOG_DIR}/server.log" ]; then
        tail -n "$lines" "${LOG_DIR}/server.log"
    elif command -v pm2 &> /dev/null; then
        pm2 logs gemini-bridge-server --lines "$lines"
    else
        warn "No logs found"
    fi
}

# Main function
main() {
    cd "$SCRIPT_DIR"
    
    case "${1:-start}" in
        "start")
            if check_running; then
                exit 1
            fi
            create_directories
            check_dependencies
            install_dependencies
            start_server
            ;;
        "stop")
            stop_server
            ;;
        "restart")
            restart_server
            ;;
        "status")
            show_status
            ;;
        "health")
            health_check
            ;;
        "logs")
            show_logs "${2:-50}"
            ;;
        "install")
            create_directories
            check_dependencies
            install_dependencies
            log "✅ Installation complete"
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|health|logs|install}"
            echo ""
            echo "Commands:"
            echo "  start    - Start the server"
            echo "  stop     - Stop the server"
            echo "  restart  - Restart the server"
            echo "  status   - Show server status"
            echo "  health   - Check server health"
            echo "  logs     - Show server logs (default: 50 lines)"
            echo "  install  - Install dependencies only"
            echo ""
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"