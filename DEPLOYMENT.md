# Sudoku Game - Kubernetes Deployment Guide

This guide will help you deploy the Sudoku game to your Kubernetes cluster with automated Docker builds via GitHub Actions.

## Prerequisites

Before deploying, ensure you have the following installed and configured:

-   kubectl configured to access your Kubernetes cluster
-   NGINX Ingress Controller installed in your cluster
-   cert-manager installed in your cluster for SSL certificates

## Automated Docker Build Setup

This project uses GitHub Actions to automatically build and push Docker images to Docker Hub.

### GitHub Secrets Configuration

To enable automated builds, configure the following secrets in your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following repository secrets:
    - `DOCKERHUB_USERNAME`: Your Docker Hub username
    - `DOCKERHUB_TOKEN`: Your Docker Hub access token (create one at https://hub.docker.com/settings/security)

### Automatic Builds

The GitHub Actions workflow will automatically:

-   Build Docker images on every push to `main`/`master` branch
-   Build multi-platform images (linux/amd64, linux/arm64)
-   Push images to Docker Hub as `carlliljencrantz/sudoku-game:latest`
-   Create tagged versions for Git tags (e.g., `v1.0.0`)

## Quick Deployment

### 1. Deploy to Kubernetes

The application is configured to use the domain `sudoku.liljen.se`. Deploy in the following order:

```bash
# 1. Create the ClusterIssuer for SSL certificates
kubectl apply -f k8s/issuer.yaml

# 2. Deploy the application
kubectl apply -f k8s/deployment.yaml

# 3. Create the service
kubectl apply -f k8s/service.yaml

# 4. Create the ingress (this will trigger SSL certificate creation)
kubectl apply -f k8s/ingress.yaml
```

### 2. Verify Deployment

Check that all resources are running:

```bash
# Check pods
kubectl get pods -l app=sudoku-game

# Check service
kubectl get service sudoku-game-service

# Check ingress
kubectl get ingress sudoku-game-ingress

# Check SSL certificate
kubectl get certificate sudoku-game-tls
```

## Configuration Details

### Docker Image

The Docker image is automatically built and pushed to Docker Hub:

-   **Repository**: `carlliljencrantz/sudoku-game`
-   **Tags**: `latest` (from main branch), version tags (from Git tags)
-   **Platforms**: linux/amd64, linux/arm64
-   **Build**: Multi-stage optimized for production

### Kubernetes Resources

#### Deployment

-   **Image**: `carlliljencrantz/sudoku-game:latest`
-   **Replicas**: 2 (for high availability)
-   **Resources**:
    -   Requests: 128Mi memory, 100m CPU
    -   Limits: 256Mi memory, 200m CPU
-   **Health Checks**: Liveness and readiness probes on port 3000
-   **Environment**: Production configuration

#### Service

-   **Type**: ClusterIP (internal access only)
-   **Port**: 80 (external) → 3000 (container)

#### Ingress

-   **Class**: nginx
-   **SSL**: Automatic certificate generation via cert-manager
-   **Host**: sudoku.liljen.se
-   **Path**: Root path (/) routes to the application

#### ClusterIssuer

-   **Provider**: Let's Encrypt production
-   **Challenge**: HTTP-01 via NGINX ingress
-   **Email**: Configurable for certificate notifications (update in `k8s/issuer.yaml`)

## Customization

### Scaling

To scale the application:

```bash
kubectl scale deployment sudoku-game --replicas=5
```

### Resource Limits

Adjust resource limits in `k8s/deployment.yaml` based on your cluster capacity:

```yaml
resources:
    requests:
        memory: '256Mi'
        cpu: '200m'
    limits:
        memory: '512Mi'
        cpu: '500m'
```

### Environment Variables

Add additional environment variables in the deployment:

```yaml
env:
    - name: CUSTOM_VAR
      value: 'custom-value'
```

### Different Domain

To use a different domain:

1. Update `k8s/ingress.yaml` and replace `sudoku.liljen.se` with your domain
2. Update DNS records to point to your ingress controller

### Multiple Environments

For different environments (staging, production), create separate namespaces:

```bash
# Create namespace
kubectl create namespace sudoku-staging

# Deploy to specific namespace
kubectl apply -f k8s/ -n sudoku-staging
```

## Development Workflow

### Making Changes

1. Make your code changes
2. Commit and push to the `main` branch
3. GitHub Actions will automatically build and push a new Docker image
4. Update your Kubernetes deployment:
    ```bash
    kubectl rollout restart deployment/sudoku-game
    ```

### Creating Releases

To create a versioned release:

1. Create a Git tag:
    ```bash
    git tag v1.0.0
    git push origin v1.0.0
    ```
2. GitHub Actions will build and push the image with version tags
3. Update deployment to use the specific version:
    ```bash
    # Edit k8s/deployment.yaml to use carlliljencrantz/sudoku-game:v1.0.0
    kubectl apply -f k8s/deployment.yaml
    ```

## Troubleshooting

### Common Issues

1. **Image Pull Errors**

    ```bash
    # Check if image exists on Docker Hub
    docker pull carlliljencrantz/sudoku-game:latest
    ```

2. **GitHub Actions Build Failures**

    - Check GitHub Actions logs in the repository
    - Verify Docker Hub credentials are correctly set in GitHub secrets
    - Ensure Docker Hub token has write permissions

3. **SSL Certificate Issues**

    ```bash
    # Check certificate status
    kubectl describe certificate sudoku-game-tls

    # Check cert-manager logs
    kubectl logs -n cert-manager deployment/cert-manager
    ```

4. **Ingress Not Working**

    ```bash
    # Check ingress controller
    kubectl get pods -n ingress-nginx

    # Check ingress events
    kubectl describe ingress sudoku-game-ingress
    ```

5. **Pod Startup Issues**

    ```bash
    # Check pod logs
    kubectl logs -l app=sudoku-game

    # Check pod events
    kubectl describe pods -l app=sudoku-game
    ```

### Monitoring

Monitor the application:

```bash
# Watch pods
kubectl get pods -l app=sudoku-game -w

# Check resource usage
kubectl top pods -l app=sudoku-game

# View logs
kubectl logs -f deployment/sudoku-game
```

## Security Considerations

-   The application runs as a non-root user
-   SSL/TLS encryption is enforced
-   Resource limits prevent resource exhaustion
-   Docker images are built with security best practices
-   Multi-platform builds ensure compatibility

## Cleanup

To remove the deployment:

```bash
kubectl delete -f k8s/
```

## Support

For issues with the deployment, check:

1. GitHub Actions build logs
2. Kubernetes cluster status
3. NGINX Ingress Controller logs
4. cert-manager logs
5. Application logs

## Access

Once deployed, the sudoku game will be available at:
**https://sudoku.liljen.se**
