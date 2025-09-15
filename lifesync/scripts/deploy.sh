#!/bin/bash

# Deployment Script for LifeSync
# Supports multiple environments and deployment targets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
TARGET="netlify"
BUILD_ONLY=false
SKIP_TESTS=false
VERBOSE=false

# Function to display help
show_help() {
    echo -e "${BLUE}LifeSync Deployment Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV         Environment to deploy to (staging|production) [default: staging]"
    echo "  -t, --target TARGET   Deployment target (netlify|vercel|aws|local) [default: netlify]"
    echo "  -b, --build-only      Only build, don't deploy"
    echo "  -s, --skip-tests      Skip running tests before deployment"
    echo "  -v, --verbose         Verbose output"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Deploy to staging on Netlify"
    echo "  $0 -e production -t netlify          # Deploy to production on Netlify"
    echo "  $0 -b                                # Build only, no deployment"
    echo "  $0 -e staging -s                     # Deploy to staging, skip tests"
    echo ""
    echo "Environment Variables:"
    echo "  NETLIFY_AUTH_TOKEN    Netlify authentication token"
    echo "  NETLIFY_SITE_ID       Netlify site ID"
    echo "  VERCEL_TOKEN          Vercel authentication token"
    echo "  AWS_ACCESS_KEY_ID     AWS access key"
    echo "  AWS_SECRET_ACCESS_KEY AWS secret key"
    echo ""
}

# Function to log messages
log() {
    local level=$1
    shift
    local message="$*"
    
    case $level in
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "step")
            echo -e "${PURPLE}🚀 $message${NC}"
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    log "step" "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log "error" "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log "error" "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log "error" "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log "error" "git is not installed. Please install git first."
        exit 1
    fi
    
    log "success" "All prerequisites met"
}

# Function to install dependencies
install_dependencies() {
    log "step" "Installing dependencies..."
    
    if [ "$VERBOSE" = true ]; then
        npm ci
    else
        npm ci --silent
    fi
    
    log "success" "Dependencies installed"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log "warning" "Skipping tests (--skip-tests flag provided)"
        return 0
    fi
    
    log "step" "Running tests..."
    
    # Run linter
    log "info" "Running linter..."
    npm run lint
    
    # Run type check
    log "info" "Running type check..."
    npx tsc --noEmit
    
    # Run unit tests
    log "info" "Running unit tests..."
    npm run test -- --run
    
    # Run ProjectTracking tests
    log "info" "Running ProjectTracking tests..."
    npm run test:project-tracking:coverage
    
    log "success" "All tests passed"
}

# Function to generate version info
generate_version() {
    log "step" "Generating version information..."
    
    npm run version:generate
    
    # Show version info
    if [ "$VERBOSE" = true ]; then
        npm run version
    fi
    
    log "success" "Version information generated"
}

# Function to build application
build_application() {
    log "step" "Building application for $ENVIRONMENT environment..."
    
    # Set environment variables
    export NODE_ENV=$ENVIRONMENT
    export VITE_VERSION=$(node -p "require('./package.json').version")
    export VITE_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export VITE_COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    export VITE_ENVIRONMENT=$ENVIRONMENT
    
    # Build the application
    if [ "$VERBOSE" = true ]; then
        npm run build
    else
        npm run build > /dev/null 2>&1
    fi
    
    # Check if build was successful
    if [ ! -d "dist" ]; then
        log "error" "Build failed - dist directory not found"
        exit 1
    fi
    
    log "success" "Application built successfully"
    
    # Show build info
    if [ "$VERBOSE" = true ]; then
        log "info" "Build size:"
        du -sh dist/
        ls -la dist/
    fi
}

# Function to deploy to Netlify
deploy_netlify() {
    log "step" "Deploying to Netlify ($ENVIRONMENT)..."
    
    # Check for Netlify CLI
    if ! command -v netlify &> /dev/null; then
        log "info" "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Check for auth token
    if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
        log "error" "NETLIFY_AUTH_TOKEN environment variable is required"
        exit 1
    fi
    
    # Deploy
    if [ "$ENVIRONMENT" = "production" ]; then
        netlify deploy --prod --dir=dist --message="Production deployment $(date)"
    else
        netlify deploy --dir=dist --message="Staging deployment $(date)"
    fi
    
    log "success" "Deployed to Netlify"
}

# Function to deploy to Vercel
deploy_vercel() {
    log "step" "Deploying to Vercel ($ENVIRONMENT)..."
    
    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log "info" "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    
    log "success" "Deployed to Vercel"
}

# Function to deploy to AWS S3
deploy_aws() {
    log "step" "Deploying to AWS S3 ($ENVIRONMENT)..."
    
    # Check for AWS CLI
    if ! command -v aws &> /dev/null; then
        log "error" "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    # Check for credentials
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        log "error" "AWS credentials are required (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)"
        exit 1
    fi
    
    # Set bucket name based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        BUCKET_NAME="lifesync-prod"
    else
        BUCKET_NAME="lifesync-staging"
    fi
    
    # Sync to S3
    aws s3 sync dist/ s3://$BUCKET_NAME --delete
    
    # Invalidate CloudFront (if configured)
    if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        log "info" "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
    fi
    
    log "success" "Deployed to AWS S3"
}

# Function to deploy locally (for testing)
deploy_local() {
    log "step" "Starting local preview server..."
    
    log "info" "Preview server will be available at http://localhost:4173"
    log "info" "Press Ctrl+C to stop the server"
    
    npm run preview
}

# Main deployment function
deploy() {
    case $TARGET in
        "netlify")
            deploy_netlify
            ;;
        "vercel")
            deploy_vercel
            ;;
        "aws")
            deploy_aws
            ;;
        "local")
            deploy_local
            ;;
        *)
            log "error" "Unknown deployment target: $TARGET"
            log "info" "Supported targets: netlify, vercel, aws, local"
            exit 1
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--target)
            TARGET="$2"
            shift 2
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log "error" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log "error" "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 1
fi

# Main execution
main() {
    log "info" "Starting deployment process..."
    log "info" "Environment: $ENVIRONMENT"
    log "info" "Target: $TARGET"
    log "info" "Build only: $BUILD_ONLY"
    
    check_prerequisites
    install_dependencies
    run_tests
    generate_version
    build_application
    
    if [ "$BUILD_ONLY" = false ]; then
        deploy
    else
        log "info" "Build complete. Skipping deployment (--build-only flag provided)"
    fi
    
    log "success" "Deployment process completed successfully! 🎉"
}

# Run main function
main