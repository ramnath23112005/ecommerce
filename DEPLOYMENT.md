# Deployment Guide

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB 7+
- Redis 7+
- Git

## Local Development

### 1. Clone and Setup
```bash
git clone <repo-url>
cd ecommerce-platform
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local
```

### 3. Start Dependencies
```bash
# Start MongoDB and Redis (using Docker)
docker run -d -p 27017:27017 --name mongodb mongo:7
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### 4. Seed Database
```bash
npm run seed
```

### 5. Run Application
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Or both at once
npm run dev
```

## Docker Deployment

### Quick Start
```bash
docker-compose up -d
```

This starts: MongoDB, Redis, Elasticsearch, Backend, Frontend, Nginx

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- Health Check: http://localhost:5000/health

## Production Deployment

### Option 1: Docker Compose (Single Server)
```bash
# Set production environment variables
cp backend/.env.example backend/.env
# Update with production values

docker-compose -f docker-compose.yml up -d
```

### Option 2: Kubernetes

Create secrets and configmaps:
```bash
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=... \
  --from-literal=STRIPE_SECRET_KEY=...
```

Apply manifests:
```bash
kubectl apply -f k8s/
```

### Option 3: Manual Deployment

#### Backend
```bash
cd backend
npm ci --only=production
npm run build
pm2 start dist/server.js --name ecommerce-backend
```

#### Frontend
```bash
cd frontend
npm ci
npm run build
npx next start -p 3000
```

### Nginx Configuration (Production)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Variables

### Backend (.env)
| Variable | Description |
|----------|-------------|
| NODE_ENV | Environment (development/production) |
| PORT | Server port (default: 5000) |
| MONGODB_URI | MongoDB connection string |
| REDIS_URL | Redis connection string |
| JWT_SECRET | JWT signing secret |
| JWT_REFRESH_SECRET | Refresh token secret |
| GOOGLE_CLIENT_ID | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret |
| STRIPE_SECRET_KEY | Stripe secret key |
| RAZORPAY_KEY_ID | Razorpay key ID |
| RAZORPAY_KEY_SECRET | Razorpay key secret |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| SMTP_HOST | SMTP server host |
| SMTP_PORT | SMTP server port |
| SMTP_USER | SMTP username |
| SMTP_PASS | SMTP password |
| FRONTEND_URL | Frontend URL for CORS |

### Frontend (.env.local)
| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_API_URL | Backend API URL |
| NEXT_PUBLIC_STRIPE_KEY | Stripe publishable key |
| NEXT_PUBLIC_RAZORPAY_KEY_ID | Razorpay key ID |

## CI/CD

The project includes GitHub Actions workflow (`.github/workflows/ci-cd.yml`):
- Lint and test backend
- Lint and build frontend
- Build and push Docker images
- Deploy to production server

## Monitoring

- Backend logs: `backend/logs/`
- Winston logging with daily rotate
- Morgan HTTP request logging
- Health endpoint: `GET /health`
