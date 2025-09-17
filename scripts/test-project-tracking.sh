#!/bin/bash

# ProjectTracking Test Runner Script
# This script provides an easy way to run ProjectTracking component tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MODE="run"
COVERAGE=false
WATCH=false
UI=false

# Function to display help
show_help() {
    echo -e "${BLUE}ProjectTracking Test Runner${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help        Show this help message"
    echo "  -w, --watch       Run tests in watch mode"
    echo "  -c, --coverage    Run tests with coverage report"
    echo "  -u, --ui          Run tests with interactive UI"
    echo "  -r, --run         Run tests once (default)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all ProjectTracking tests"
    echo "  $0 --watch           # Run tests in watch mode"
    echo "  $0 --coverage        # Run with coverage report"
    echo "  $0 --ui              # Run with interactive UI"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -w|--watch)
            WATCH=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -u|--ui)
            UI=true
            shift
            ;;
        -r|--run)
            MODE="run"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if ProjectTracking component exists
if [ ! -f "src/pages/ProjectTracking.tsx" ]; then
    echo -e "${RED}Error: ProjectTracking.tsx not found. Make sure the component exists.${NC}"
    exit 1
fi

# Check if test files exist
if [ ! -d "src/pages/__tests__" ]; then
    echo -e "${RED}Error: Test directory not found. Make sure tests are in src/pages/__tests__/${NC}"
    exit 1
fi

echo -e "${BLUE}🧪 ProjectTracking Test Runner${NC}"
echo -e "${YELLOW}==============================${NC}"

# Build the npm command based on options
if [ "$UI" = true ]; then
    echo -e "${GREEN}Running tests with interactive UI...${NC}"
    npm run test:project-tracking:ui
elif [ "$COVERAGE" = true ]; then
    echo -e "${GREEN}Running tests with coverage report...${NC}"
    npm run test:project-tracking:coverage
    
    # Check if coverage was generated
    if [ -d "coverage" ]; then
        echo -e "${GREEN}✅ Coverage report generated in coverage/ directory${NC}"
        echo -e "${BLUE}Open coverage/index.html in your browser to view detailed report${NC}"
    fi
elif [ "$WATCH" = true ]; then
    echo -e "${GREEN}Running tests in watch mode...${NC}"
    echo -e "${YELLOW}Press 'q' to quit, 'a' to run all tests${NC}"
    npm run test:project-tracking:watch
else
    echo -e "${GREEN}Running all ProjectTracking tests...${NC}"
    npm run test:project-tracking
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests completed successfully!${NC}"
else
    echo -e "${RED}❌ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi