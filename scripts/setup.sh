#!/bin/bash

echo "Setting up E-Commerce Platform..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install from https://docker.com"; exit 1; }

# Setup backend
echo "Setting up backend..."
cd backend
cp .env.example .env
npm install
cd ..

# Setup frontend
echo "Setting up frontend..."
cd frontend
cp .env.local.example .env.local
npm install
cd ..

# Setup shared
echo "Linking shared types..."
cd shared
npm install
cd ..

echo ""
echo "Setup complete!"
echo ""
echo "To run in development mode:"
echo "  npm run dev:backend   # Start backend (port 5000)"
echo "  npm run dev:frontend  # Start frontend (port 3000)"
echo "  npm run dev           # Start both"
echo ""
echo "To run with Docker:"
echo "  docker-compose up -d"
echo ""
echo "To seed the database:"
echo "  npm run seed"
echo ""
echo "Default credentials:"
echo "  Admin:    admin@ecommerce.com / admin123"
echo "  Seller:   seller@ecommerce.com / seller123"
echo "  Customer: customer@ecommerce.com / customer123"
