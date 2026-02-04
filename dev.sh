#!/bin/bash

# IIDX Tier Tracker - Development Server Startup Script
# This script starts both frontend and backend servers simultaneously

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# PIDs for cleanup
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"

    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "${RED}Stopping backend (PID: $BACKEND_PID)${NC}"
        kill "$BACKEND_PID" 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${BLUE}Stopping frontend (PID: $FRONTEND_PID)${NC}"
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi

    # Wait for processes to terminate
    wait 2>/dev/null || true

    echo -e "${GREEN}All servers stopped.${NC}"
    exit 0
}

# Set trap for cleanup on script termination
trap cleanup SIGINT SIGTERM EXIT

# Print banner
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           IIDX Tier Tracker - Dev Environment             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if node_modules exist
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd "$SCRIPT_DIR/backend" && npm install
fi

if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$SCRIPT_DIR/frontend" && npm install
fi

# Start backend
echo -e "${RED}[Backend]${NC} Starting on port 5000..."
cd "$SCRIPT_DIR/backend"
npm run dev 2>&1 | sed "s/^/$(printf "${RED}[Backend]${NC} ")/" &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# Start frontend
echo -e "${BLUE}[Frontend]${NC} Starting on port 5173..."
cd "$SCRIPT_DIR/frontend"
npm run dev -- --host 2>&1 | sed "s/^/$(printf "${BLUE}[Frontend]${NC} ")/" &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}Both servers are starting...${NC}"
echo -e "  Backend:  ${RED}http://localhost:5000${NC}"
echo -e "  Frontend: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for both processes
wait
