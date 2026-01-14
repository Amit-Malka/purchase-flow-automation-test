#!/bin/bash

# Script to upload environment variables to AWS Secrets Manager
# Usage: ./scripts/setup-secrets.sh

set -e

echo "Setting up AWS Secrets Manager for QA Automation..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Please create .env file from .env.example and fill in your values"
    exit 1
fi

# Load environment variables
source .env

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# Create or update secrets
echo "Creating/updating secrets in AWS Secrets Manager..."

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" 2>/dev/null; then
        echo "Updating secret: $secret_name"
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_value" \
            --region "$AWS_REGION"
    else
        echo "Creating secret: $secret_name"
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --secret-string "$secret_value" \
            --region "$AWS_REGION"
    fi
}

# Create secrets for each environment variable
create_or_update_secret "qa-automation/test-user-email" "$TEST_USER_EMAIL"
create_or_update_secret "qa-automation/test-user-password" "$TEST_USER_PASSWORD"
create_or_update_secret "qa-automation/active-sub-email" "$ACTIVE_SUB_EMAIL"
create_or_update_secret "qa-automation/inactive-sub-email" "$INACTIVE_SUB_EMAIL"
create_or_update_secret "qa-automation/slack-webhook-url" "$SLACK_WEBHOOK_URL"

echo ""
echo "✓ Secrets setup completed successfully!"
echo ""
echo "Lambda function will have access to these secrets via IAM policy."
