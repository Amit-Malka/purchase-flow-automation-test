# PowerShell script to upload environment variables to AWS Secrets Manager
# Usage: .\scripts\setup-secrets.ps1

$ErrorActionPreference = "Stop"

Write-Host "Setting up AWS Secrets Manager for QA Automation..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "Error: .env file not found" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example and fill in your values"
    exit 1
}

# Load environment variables from .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path "env:$name" -Value $value
    }
}

# Get AWS account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }

Write-Host "AWS Account: $AWS_ACCOUNT_ID"
Write-Host "AWS Region: $AWS_REGION"

# Function to create or update secret
function Set-Secret {
    param(
        [string]$SecretName,
        [string]$SecretValue
    )
    
    try {
        aws secretsmanager describe-secret --secret-id $SecretName --region $AWS_REGION 2>$null
        Write-Host "Updating secret: $SecretName"
        aws secretsmanager update-secret `
            --secret-id $SecretName `
            --secret-string $SecretValue `
            --region $AWS_REGION
    }
    catch {
        Write-Host "Creating secret: $SecretName"
        aws secretsmanager create-secret `
            --name $SecretName `
            --secret-string $SecretValue `
            --region $AWS_REGION
    }
}

# Create secrets for each environment variable
Write-Host "`nCreating/updating secrets in AWS Secrets Manager..."
Set-Secret "qa-automation/test-user-email" $env:TEST_USER_EMAIL
Set-Secret "qa-automation/test-user-password" $env:TEST_USER_PASSWORD
Set-Secret "qa-automation/active-sub-email" $env:ACTIVE_SUB_EMAIL
Set-Secret "qa-automation/inactive-sub-email" $env:INACTIVE_SUB_EMAIL
Set-Secret "qa-automation/slack-webhook-url" $env:SLACK_WEBHOOK_URL

Write-Host "`n✓ Secrets setup completed successfully!" -ForegroundColor Green
Write-Host "`nLambda function will have access to these secrets via IAM policy."
