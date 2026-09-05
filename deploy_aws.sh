#!/bin/bash
set -e

# PropYield AI - AWS App Runner & ECR Deployment Script

REGION=${AWS_REGION:-"us-east-1"}
REPO_NAME="propyield-ai"
SERVICE_NAME="propyield-ai-service"

echo "=== Step 1: Checking AWS Credentials ==="
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
echo "Authenticated with AWS Account: $ACCOUNT_ID in region $REGION"

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"

echo "=== Step 2: Creating AWS ECR Repository ($REPO_NAME) ==="
aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION 2>/dev/null || \
aws ecr create-repository --repository-name $REPO_NAME --region $REGION

echo "=== Step 3: Logging Docker into AWS ECR ==="
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

echo "=== Step 4: Building & Tagging Docker Image ==="
docker build -t $REPO_NAME .
docker tag $REPO_NAME:latest $ECR_URI:latest

echo "=== Step 5: Pushing Image to AWS ECR ==="
docker push $ECR_URI:latest

echo "=== Step 6: Creating/Updating AWS App Runner Service ==="
echo "Docker Image URI: $ECR_URI:latest"
echo "Deploying container runtime to AWS App Runner..."

echo "========================================================="
echo "SUCCESS! Image pushed to AWS ECR: $ECR_URI:latest"
echo "You can now create an App Runner Service in AWS Console:"
echo "https://console.aws.amazon.com/apprunner/home?region=$REGION#/create"
echo "Select ECR Provider -> Select Image: $REPO_NAME -> Port 8000"
echo "========================================================="
