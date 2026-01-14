# Quick Start Guide

Get up and running in 10 minutes.

## 🚀 Option 1: Run Tests Locally

### 1. Install
```bash
npm install
npx playwright install chromium
```

### 2. Setup Environment
```bash
cp env.example.txt .env
```

Edit `.env`:
```env
TEST_USER_EMAIL=your-test-email@example.com
TEST_USER_PASSWORD=YourPassword123
ACTIVE_SUB_EMAIL=active-user@example.com
INACTIVE_SUB_EMAIL=inactive-user@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Run Tests
```bash
npm test
```

### 4. View Results
```bash
npm run test:report
```

## ☁️ Option 2: Deploy to AWS Lambda

### Prerequisites
- AWS CLI configured (`aws configure`)
- AWS CDK installed (`npm install -g aws-cdk`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Bootstrap CDK (First time only)
```bash
npx cdk bootstrap
```

### 3. Setup Environment
```bash
cp env.example.txt .env
# Edit .env with your credentials
```

### 4. Upload Secrets to AWS
**Windows:**
```powershell
.\scripts\setup-secrets.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

### 5. Deploy
```bash
npm run deploy
```

### 6. Test Lambda
```bash
aws lambda invoke --function-name $(aws cloudformation describe-stacks --stack-name QaAutomationStack --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' --output text) --payload '{}' response.json
```

## 📱 Setup Slack Webhook

1. Go to https://api.slack.com/apps
2. Create New App → From scratch
3. Enable "Incoming Webhooks"
4. Add webhook to workspace
5. Copy webhook URL
6. Add to `.env` or AWS Secrets Manager

## 🔑 Setup Google Auth (Optional)

For Google OAuth login test:
```bash
npm run setup:google
```

Browser opens → Log in manually → Auth state saved

## 🎯 Common Commands

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific suite
npm run test:auth
npm run test:purchase

# View report
npm run test:report

# Deploy to AWS
npm run deploy

# Destroy AWS resources
npm run destroy
```

## 📋 Test Coverage

- ✅ Regular signup (no coupon)
- ✅ Signup with URL coupon (NY1VUIAL)
- ✅ Signup with Omni coupon (OMNI1234)
- ✅ WordPress login
- ✅ Google OAuth login
- ✅ Active subscription access
- ✅ Inactive subscription handling
- ✅ Subscription renewal

## 🔍 Verify Everything Works

### Local Test
```bash
# Should see all tests passing
npm test

# Should open browser report
npm run test:report
```

### AWS Test
```bash
# Should return success message
aws lambda invoke --function-name YOUR_FUNCTION_NAME --payload '{}' response.json
cat response.json

# Should see test report in Slack channel
# Check CloudWatch logs
aws logs tail /aws/lambda/YOUR_FUNCTION_NAME --follow
```

## ⏰ Schedule Configuration

Default: Daily at 10am UTC

To change, edit `cdk/lib/qa-stack.ts`:
```typescript
schedule: events.Schedule.cron({
  minute: '0',
  hour: '15',  // 10am EST
})
```

Then redeploy: `npm run deploy`

## 🆘 Troubleshooting

### Tests fail locally
- Check test credentials in `.env`
- Verify test accounts are active
- Run with UI to debug: `npm run test:ui`

### Lambda timeout
- Increase timeout in `cdk/lib/qa-stack.ts`
- Check CloudWatch logs for errors

### No Slack notification
- Verify webhook URL is correct
- Test webhook with curl
- Check Lambda logs

## 📚 Full Documentation

- [README.md](README.md) - Complete documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide

## ⚡ Quick Tips

1. **Test locally first** before deploying to AWS
2. **Use separate test accounts** - never use production accounts
3. **Check CloudWatch logs** if Lambda fails
4. **Rotate credentials** periodically for security
5. **Monitor costs** - Lambda should cost ~$6-7/month

## 🎉 You're Done!

Tests will now run automatically every day at 10am with results sent to Slack.

To update tests, modify files in `tests/` and run `npm run deploy`.
