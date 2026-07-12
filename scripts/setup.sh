#!/bin/bash
# NexaROS Setup Script
set -e

echo "🚀 Setting up NexaROS development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install it first."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install it first."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm not found. Run: npm install -g pnpm"; exit 1; }
command -v flutter >/dev/null 2>&1 || { echo "❌ Flutter not found. Install it first."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not found. Install it first."; exit 1; }

echo "✅ All prerequisites found"

# Start Docker services
echo "🐳 Starting PostgreSQL and Redis..."
docker compose -f docker/docker-compose.yml up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd apps/backend && pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start backend:  cd apps/backend && pnpm run start:dev"
echo "   2. API Docs:       http://localhost:4000/docs"
echo "   3. Flutter app:    cd apps/flutter-app && flutter run"
echo ""
