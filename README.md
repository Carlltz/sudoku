# 🎮 Modern Sudoku Game

A beautiful, modern sudoku game built with Next.js and deployed on Kubernetes with automated CI/CD.

![Sudoku Game](https://img.shields.io/badge/Game-Sudoku-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-green)

## 🌟 Features

-   **Modern UI/UX**: Beautiful gradient design with glassmorphism effects
-   **Three Difficulty Levels**: Easy, Medium, and Hard puzzles
-   **Interactive Gameplay**:
    -   Click or keyboard input
    -   Real-time error detection
    -   Cell highlighting for rows, columns, and 3x3 boxes
    -   Hint system for assistance
-   **Game Features**:
    -   Timer tracking
    -   New game generation
    -   Completion celebration
    -   Responsive design for all devices

## 🚀 Live Demo

Visit the live application at: **[https://sudoku.liljen.se](https://sudoku.liljen.se)**

## 🛠️ Technology Stack

-   **Frontend**: Next.js 15.3.2 with TypeScript
-   **Styling**: CSS Modules with modern design patterns
-   **Containerization**: Docker with multi-stage builds
-   **Orchestration**: Kubernetes with NGINX Ingress
-   **SSL**: Automatic certificate management with cert-manager
-   **CI/CD**: GitHub Actions with Docker Hub integration

## 🎯 Quick Start

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd sudoku

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to play the game locally.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🐳 Docker

### Build and Run Locally

```bash
# Build Docker image
docker build -t sudoku-game .

# Run container
docker run -p 3000:3000 sudoku-game
```

### Docker Hub

The application is automatically built and pushed to Docker Hub:

-   **Repository**: `carlliljencrantz/sudoku-game`
-   **Tags**: `latest`, version tags (e.g., `v1.0.0`)

## ☸️ Kubernetes Deployment

### Prerequisites

-   Kubernetes cluster with kubectl access
-   NGINX Ingress Controller
-   cert-manager for SSL certificates

### Deploy

```bash
# Deploy all resources
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=sudoku-game
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🔄 CI/CD Pipeline

The project uses GitHub Actions for automated builds:

1. **Triggers**: Push to `main`/`master` branch or Git tags
2. **Build**: Multi-platform Docker images (linux/amd64, linux/arm64)
3. **Push**: Automatic push to Docker Hub
4. **Deploy**: Manual deployment to Kubernetes

### Required Secrets

Configure these secrets in your GitHub repository:

-   `DOCKERHUB_USERNAME`: Your Docker Hub username
-   `DOCKERHUB_TOKEN`: Your Docker Hub access token

## 🎮 How to Play

1. **Select Difficulty**: Choose Easy, Medium, or Hard
2. **Click a Cell**: Select an empty cell to fill
3. **Enter Numbers**: Use the number pad or keyboard (1-9)
4. **Get Hints**: Click the hint button for assistance
5. **Complete**: Fill all cells correctly to win!

### Game Rules

-   Each row must contain digits 1-9 without repetition
-   Each column must contain digits 1-9 without repetition
-   Each 3×3 box must contain digits 1-9 without repetition

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│   Docker Hub    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Users/Web     │◀───│ NGINX Ingress    │◀───│  Kubernetes     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
sudoku/
├── src/app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── SudokuGame.tsx   # Main game component
│   │   └── SudokuGame.module.css
│   ├── globals.css          # Global styles
│   └── page.tsx             # Home page
├── k8s/                     # Kubernetes manifests
│   ├── deployment.yaml      # App deployment
│   ├── service.yaml         # Service definition
│   ├── ingress.yaml         # Ingress configuration
│   └── issuer.yaml          # SSL certificate issuer
├── .github/workflows/       # GitHub Actions
│   └── docker-build.yml     # CI/CD pipeline
├── Dockerfile               # Container definition
├── .dockerignore           # Docker ignore rules
└── DEPLOYMENT.md           # Deployment guide
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

-   **Live Application**: [https://sudoku.liljen.se](https://sudoku.liljen.se)
-   **Docker Hub**: [carlliljencrantz/sudoku-game](https://hub.docker.com/r/carlliljencrantz/sudoku-game)
-   **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)

---

Made with ❤️ using Next.js and Kubernetes
