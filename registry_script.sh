#!/bin/bash
set -e

# Configuration
REGION="us-central1"
REPO_NAME="restaurant-hubspot-tools"
PROJECT_ID=$(gcloud config get-value project)

# 1. Create a Docker repository in Artifact Registry
echo "Creating Artifact Registry repository: $REPO_NAME"
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for Restaurant Investigation Tool" || true

# 2. Configure Docker to authenticate with Artifact Registry
echo "Configuring Docker authentication..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Registry base URL
REGISTRY_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"

# 3. Build and tag both the backend and frontend images
echo "Building and tagging backend image..."
docker build -t ${REGISTRY_URL}/backend:latest .

echo "Building and tagging frontend image..."
docker build -t ${REGISTRY_URL}/frontend:latest ./frontend

# 4. Push them to the registry
echo "Pushing images to Artifact Registry..."
docker push ${REGISTRY_URL}/backend:latest
docker push ${REGISTRY_URL}/frontend:latest

echo "Images successfully pushed and are ready for deployment!"
