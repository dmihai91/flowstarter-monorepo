# Docker Deployment Guide

This guide explains how to deploy the Flowstarter MCP Server using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+ (optional, for easier deployment)
- Clerk API credentials (secret key and publishable key)

## Quick Start

### Using Docker Compose (Recommended)

1. **Create environment file**
   ```bash
   cd mcp-server
   cp .env.example .env
   ```

2. **Edit `mcp-server/.env` and add your Clerk credentials**
   ```env
   CLERK_SECRET_KEY=sk_test_your_actual_secret_key
   CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
   ```

3. **Build and run from repository root**
   ```bash
   cd ..
   docker-compose up -d
   ```

4. **View logs**
   ```bash
   docker-compose logs -f mcp-server
   ```

5. **Stop the server**
   ```bash
   docker-compose down
   ```

Note: All Docker commands should be run from the repository root directory.

### Using Docker CLI

1. **Build the image from the repository root**
   ```bash
   cd /path/to/flowstarter-templates
   docker build -t mcp-server .
   ```

2. **Run the container**
   ```bash
   docker run -it --rm \
     -e CLERK_SECRET_KEY="your_secret_key" \
     -e CLERK_PUBLISHABLE_KEY="your_publishable_key" \
     --name mcp-server \
     mcp-server
   ```

## Building from the MCP Server Directory

Note: The Dockerfile is located in the repository root and includes all templates in the image.

## Production Deployment

### Environment Variables

Required environment variables:
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `NODE_ENV`: Set to `production` (default in Dockerfile)

### Using in Production

1. **Build the production image**
   ```bash
   docker build -t mcp-server:latest .
   ```

2. **Tag and push to your registry** (e.g., Docker Hub, ECR, GCR)
   ```bash
   docker tag mcp-server:latest your-registry/mcp-server:latest
   docker push your-registry/mcp-server:latest
   ```

3. **Deploy to your infrastructure**
   - Kubernetes: Use as a sidecar container or standalone deployment
   - AWS ECS/Fargate: Deploy as a task
   - Cloud Run: Deploy as a service
   - Any Docker-compatible platform

### Example Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: your-registry/mcp-server:latest
        env:
        - name: CLERK_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: clerk-credentials
              key: secret-key
        - name: CLERK_PUBLISHABLE_KEY
          valueFrom:
            secretKeyRef:
              name: clerk-credentials
              key: publishable-key
        stdin: true
        tty: true
```

## Current Limitations

- The MCP server currently uses **stdio transport**, which means it's designed for local/process communication
- For remote access, you'll need to implement HTTP/SSE transport (see MCP SDK documentation)
- The Docker container runs interactively with `stdin_open: true` and `tty: true`

## Future Enhancements

To make this more suitable for cloud deployment:

1. **Add HTTP Transport Support**
   - Implement Streamable HTTP transport
   - Expose port 3000 (uncomment in Dockerfile)
   - Add health check endpoint

2. **Multi-stage Build**
   - Optimize image size with multi-stage builds
   - Separate build and runtime stages

3. **Health Checks**
   - Add Docker health check
   - Add readiness/liveness probes for Kubernetes

## Troubleshooting

### Container exits immediately
- Ensure environment variables are set correctly
- Check logs: `docker logs mcp-server`

### Authentication errors
- Verify Clerk credentials are correct
- Ensure no trailing spaces in environment variables

### Template not found
- Verify the Docker build context includes all template directories
- Check that templates are copied correctly in the Dockerfile

## Support

For issues or questions, please open an issue in the repository.
