# Deploying MCP Server to Sevalla

Complete guide for deploying the Flowstarter MCP Server to Sevalla (formerly Krystal) hosting.

## Prerequisites

- Sevalla account with Docker hosting capability
- Docker registry access (or use Sevalla's built-in registry)
- Clerk API credentials
- Git repository with your code

## Deployment Options

### Option 1: Docker Deployment (Recommended)

Sevalla supports Docker containers natively.

#### Step 1: Build and Push Docker Image

```bash
# Build the image
cd /path/to/flowstarter-templates
docker build -t mcp-server:latest .

# Tag for your registry (e.g., Docker Hub)
docker tag mcp-server:latest yourusername/mcp-server:latest

# Push to registry
docker push yourusername/mcp-server:latest
```

#### Step 2: Configure Sevalla

1. **Log into Sevalla Dashboard**
   - Go to your Sevalla control panel
   - Navigate to "Docker" or "Containers" section

2. **Create New Container**
   - Image: `yourusername/mcp-server:latest`
   - Container Name: `mcp-server`
   - Port Mapping: `3000:3000` (or your preferred external port)

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   CLERK_SECRET_KEY=sk_live_your_actual_key
   CLERK_PUBLISHABLE_KEY=pk_live_your_actual_key
   HTTP_PORT=3000
   HTTP_HOST=0.0.0.0
   CORS_ORIGIN=https://yourdomain.com
   ```

4. **Configure Health Check**
   - Endpoint: `/health`
   - Interval: 30s
   - Timeout: 10s

5. **Deploy**
   - Click "Create" or "Deploy"
   - Wait for container to start

### Option 2: Node.js Deployment

If Sevalla doesn't support Docker, you can deploy as a Node.js app.

#### Step 1: Prepare Repository

```bash
# Ensure your repo has these files
git add .
git commit -m "Prepare for Sevalla deployment"
git push origin main
```

#### Step 2: Configure Sevalla Node.js App

1. **Create New App**
   - Type: Node.js
   - Node Version: 20.x
   - Repository: Your Git URL

2. **Build Configuration**
   ```bash
   # Install dependencies
   npm install
   
   # Build TypeScript
   npm run build
   ```

3. **Start Command**
   ```bash
   node build/index.js --mode=http
   ```

4. **Environment Variables**
   Same as Docker option above

### Option 3: Using GitHub Actions + Sevalla Deploy

Create automated deployments with GitHub Actions.

#### `.github/workflows/deploy-sevalla.yml`

```yaml
name: Deploy to Sevalla

on:
  push:
    branches:
      - main
    paths:
      - 'mcp-server/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker Image
        run: |
          docker build -t ${{ secrets.DOCKER_REGISTRY }}/mcp-server:${{ github.sha }} .
          docker tag ${{ secrets.DOCKER_REGISTRY }}/mcp-server:${{ github.sha }} \
                     ${{ secrets.DOCKER_REGISTRY }}/mcp-server:latest
      
      - name: Push to Registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push ${{ secrets.DOCKER_REGISTRY }}/mcp-server:${{ github.sha }}
          docker push ${{ secrets.DOCKER_REGISTRY }}/mcp-server:latest
      
      - name: Deploy to Sevalla
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SEVALLA_HOST }}
          username: ${{ secrets.SEVALLA_USER }}
          key: ${{ secrets.SEVALLA_SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_REGISTRY }}/mcp-server:latest
            docker stop mcp-server || true
            docker rm mcp-server || true
            docker run -d \
              --name mcp-server \
              -p 3000:3000 \
              -e CLERK_SECRET_KEY=${{ secrets.CLERK_SECRET_KEY }} \
              -e CLERK_PUBLISHABLE_KEY=${{ secrets.CLERK_PUBLISHABLE_KEY }} \
              -e HTTP_PORT=3000 \
              -e CORS_ORIGIN=* \
              --restart unless-stopped \
              ${{ secrets.DOCKER_REGISTRY }}/mcp-server:latest
```

## Post-Deployment Configuration

### 1. Set Up Domain/SSL

In Sevalla:
1. Add custom domain: `mcp.yourdomain.com`
2. Enable SSL certificate (Let's Encrypt)
3. Point to port 3000

### 2. Configure Reverse Proxy (if needed)

If you need a custom domain, set up nginx:

```nginx
server {
    listen 80;
    server_name mcp.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Verify Deployment

```bash
# Test health endpoint
curl https://mcp.yourdomain.com/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "mcp-server",
#   "version": "1.0.0",
#   "transport": "streamable-http"
# }
```

### 4. Test MCP Endpoint

```bash
# Test with curl
curl -X POST https://mcp.yourdomain.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_clerk_session_token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Monitoring & Maintenance

### Logs

View logs in Sevalla dashboard or via SSH:

```bash
# Docker logs
docker logs -f mcp-server

# Or if using Node.js directly
pm2 logs mcp-server
```

### Resource Requirements

**Minimum:**
- CPU: 0.5 vCPU
- RAM: 512 MB
- Storage: 1 GB

**Recommended:**
- CPU: 1 vCPU
- RAM: 1 GB
- Storage: 2 GB

### Auto-Restart

Ensure the container/app restarts on failure:

**Docker:**
```bash
docker update --restart unless-stopped mcp-server
```

**PM2 (Node.js):**
```bash
pm2 start build/index.js --name mcp-server -- --mode=http
pm2 save
pm2 startup
```

## Connecting Claude Cloud

Once deployed, configure Claude to use your MCP server:

1. **Server URL:** `https://mcp.yourdomain.com/mcp`
2. **Authentication:** Bearer token with Clerk session
3. **CORS:** Ensure `CORS_ORIGIN` includes Claude's domains

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker logs mcp-server
```

Common issues:
- Missing environment variables
- Port already in use
- Invalid Clerk credentials

### 502 Bad Gateway

- Verify container is running: `docker ps`
- Check health endpoint: `curl http://localhost:3000/health`
- Verify reverse proxy configuration

### Authentication Errors

- Verify Clerk credentials are correct
- Check `CLERK_SECRET_KEY` format (should start with `sk_live_`)
- Test with Clerk Dashboard's API testing tools

### CORS Issues

Update `CORS_ORIGIN` environment variable:
```bash
# For multiple origins
CORS_ORIGIN=https://claude.ai,https://yourdomain.com

# For development (not recommended in production)
CORS_ORIGIN=*
```

## Updating the Server

### Docker

```bash
# Pull latest image
docker pull yourusername/mcp-server:latest

# Restart container
docker restart mcp-server
```

### Node.js

```bash
# SSH into Sevalla
ssh user@your-sevalla-server

# Pull latest code
cd /path/to/flowstarter-templates
git pull origin main

# Rebuild
cd mcp-server
npm install
npm run build

# Restart
pm2 restart mcp-server
```

## Security Best Practices

1. **Always use HTTPS** - Never expose HTTP endpoint publicly
2. **Restrict CORS** - Only allow specific domains
3. **Use production Clerk keys** - Never use test keys in production
4. **Monitor logs** - Watch for unauthorized access attempts
5. **Keep updated** - Regularly update dependencies
6. **Use secrets management** - Store credentials in Sevalla's secret manager

## Cost Optimization

- Start with smallest instance
- Monitor resource usage
- Scale up only if needed
- Use Sevalla's built-in monitoring

## Support

- **Sevalla Support:** https://www.sevalla.com/support
- **MCP Documentation:** https://modelcontextprotocol.io
- **Issues:** Open an issue in your repository

## Next Steps

After deploying:
1. ✅ Test all MCP tools via HTTP
2. ✅ Configure Claude Cloud to use your endpoint
3. ✅ Monitor performance and logs
4. ✅ Set up automated backups
5. ✅ Configure monitoring/alerting
