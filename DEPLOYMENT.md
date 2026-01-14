# Deployment Guide

Step-by-step guide to deploy QA Automation to AWS Lambda.

## Prerequisites Checklist

- [ ] AWS CLI installed ([Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- [ ] AWS CLI configured with credentials (`aws configure`)
- [ ] Node.js 18+ installed
- [ ] AWS CDK CLI installed (`npm install -g aws-cdk`)
- [ ] Test credentials ready (email/password for test accounts)
- [ ] Slack webhook URL created

## Step 1: Initial Setup

### 1.1 Clone and Install
```bash
cd QA-automation
npm install
npx playwright install chromium
```

### 1.2 Create Environment File
```bash
cp env.example.txt .env
```

Edit `.env` with your actual values:
```env
TEST_USER_EMAIL=test@yourdomain.com
TEST_USER_PASSWORD=SecurePassword123!
ACTIVE_SUB_EMAIL=active@yourdomain.com
INACTIVE_SUB_EMAIL=inactive@yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
AWS_REGION=us-east-1
```

### 1.3 Setup Google Authentication
Run this once to save Google login state:
```bash
npx playwright test tests/auth/setup-google-auth.spec.ts --headed
```

**Manual steps:**
1. Browser will open
2. Log in with your Google test account
3. Complete authentication
4. Auth state saves to `src/auth-state/google.json`
5. Browser closes automatically

## Step 2: Create Slack Webhook

### 2.1 Create Slack App
1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Select "From scratch"
4. App Name: `QA Test Reports`
5. Select your workspace
6. Click "Create App"

### 2.2 Enable Incoming Webhooks
1. In left sidebar, click "Incoming Webhooks"
2. Toggle "Activate Incoming Webhooks" to ON
3. Scroll down, click "Add New Webhook to Workspace"
4. Select channel (e.g., `#qa-reports`)
5. Click "Allow"
6. Copy the webhook URL (starts with `https://hooks.slack.com/...`)
7. Add to your `.env` file

### 2.3 Test Webhook (Optional)
```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message from QA Automation"}'
```

## Step 3: Test Locally

Before deploying, verify tests work locally:

```bash
# Load environment variables
source .env  # Linux/Mac
# OR
Get-Content .env | ForEach-Object {$_ -replace '^(.+)=(.*)$','$env:$1=$2'} | Invoke-Expression  # PowerShell

# Run all tests
npm test

# Check results
npx playwright show-report
```

Fix any failing tests before proceeding.

## Step 4: AWS CDK Bootstrap

Bootstrap CDK in your AWS account (first time only):

```bash
npx cdk bootstrap
```

Expected output:
```
 ✅  Environment aws://123456789012/us-east-1 bootstrapped.
```

## Step 5: Upload Secrets to AWS

### Option A: Windows (PowerShell)
```powershell
.\scripts\setup-secrets.ps1
```

### Option B: Linux/Mac (Bash)
```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

### Verify Secrets Created
```bash
aws secretsmanager list-secrets --query 'SecretList[?starts_with(Name, `qa-automation`)].Name'
```

Should show:
```json
[
    "qa-automation/test-user-email",
    "qa-automation/test-user-password",
    "qa-automation/active-sub-email",
    "qa-automation/inactive-sub-email",
    "qa-automation/slack-webhook-url"
]
```

## Step 6: Deploy to AWS Lambda

### 6.1 Build and Deploy
```bash
cd cdk
npm run deploy
```

Or from project root:
```bash
npx cdk deploy --app "npx ts-node cdk/bin/cdk.ts"
```

### 6.2 Deployment Process
This will:
1. Compile TypeScript
2. Bundle dependencies
3. Create CloudFormation stack
4. Create Lambda function (2GB memory, 5min timeout)
5. Create EventBridge rule (daily 10am trigger)
6. Create S3 bucket for reports
7. Configure IAM permissions

**Time:** ~5-10 minutes

### 6.3 Review Stack Outputs
After deployment, note these outputs:
```
Outputs:
QaAutomationStack.LambdaFunctionName = QaAutomationStack-QaTestsLambdaXXXXXXXX
QaAutomationStack.ReportsBucketName = qa-automation-reports-123456789012
```

## Step 7: Configure Schedule

The default schedule is 10am UTC. To change:

### 7.1 Edit Schedule
Edit `cdk/lib/qa-stack.ts`:

```typescript
const rule = new events.Rule(this, 'QaDailySchedule', {
  schedule: events.Schedule.cron({
    minute: '0',
    hour: '15',  // Change this: 15 = 10am EST (UTC-5)
  }),
});
```

**Common Timezones:**
- 10am EST (UTC-5): `hour: '15'`
- 10am PST (UTC-8): `hour: '18'`
- 10am GMT (UTC+0): `hour: '10'`
- 10am IST (UTC+5:30): `hour: '4'` and `minute: '30'`

### 7.2 Redeploy
```bash
npm run deploy
```

## Step 8: Test Lambda Function

### 8.1 Manual Invoke
```bash
aws lambda invoke \
  --function-name QaAutomationStack-QaTestsLambdaXXXXXXXX \
  --payload '{}' \
  response.json

cat response.json
```

### 8.2 Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/QaAutomationStack-QaTestsLambdaXXXXXXXX --follow
```

### 8.3 Verify Slack Message
Check your Slack channel for the test report.

## Step 9: Monitor and Maintain

### View Test Results
```bash
# List S3 reports
aws s3 ls s3://qa-automation-reports-123456789012/

# Download latest report
aws s3 cp s3://qa-automation-reports-123456789012/latest-report.json ./
```

### View Logs
```bash
aws logs tail /aws/lambda/YOUR_FUNCTION_NAME --follow
```

### Update Code
After making changes:
```bash
npm run deploy
```

### Update Secrets
```bash
# Update single secret
aws secretsmanager update-secret \
  --secret-id qa-automation/test-user-email \
  --secret-string "newemail@example.com"

# Or re-run setup script
.\scripts\setup-secrets.ps1
```

## Troubleshooting

### Issue: CDK Bootstrap Fails
**Error:** `Unable to resolve AWS account to use`

**Solution:**
```bash
aws configure
# Enter your AWS Access Key ID and Secret Access Key
```

### Issue: Lambda Timeout
**Error:** `Task timed out after 300.00 seconds`

**Solution:** Increase timeout in `cdk/lib/qa-stack.ts`:
```typescript
timeout: cdk.Duration.minutes(10),
```

### Issue: Permission Denied on Secrets
**Error:** `User is not authorized to perform: secretsmanager:GetSecretValue`

**Solution:** Verify IAM policy in `cdk/lib/qa-stack.ts`:
```typescript
qaLambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['secretsmanager:GetSecretValue'],
    resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:qa-automation/*`],
  })
);
```

### Issue: Tests Fail in Lambda but Work Locally
**Possible causes:**
1. Missing environment variables → Check secrets
2. Network issues → Check VPC settings
3. Chromium binary issues → Verify @sparticuz/chromium version

**Debug:**
```bash
# Check Lambda environment
aws lambda get-function-configuration \
  --function-name YOUR_FUNCTION_NAME
```

### Issue: No Slack Notification
**Checklist:**
1. Verify webhook URL is correct in Secrets Manager
2. Check Lambda logs for Slack errors
3. Test webhook manually with curl
4. Verify Slack app is installed in workspace

## Cost Estimate

**AWS Resources:**
- Lambda: ~$0.20/day (5min execution, 2GB memory, 1x/day)
- S3: ~$0.023/month (1GB storage)
- Secrets Manager: ~$0.40/month (5 secrets)
- EventBridge: Free (< 1M events/month)

**Total:** ~$6-7/month

## Security Best Practices

1. ✅ Never commit `.env` or auth state files
2. ✅ Use AWS Secrets Manager for credentials
3. ✅ Limit Lambda IAM permissions (principle of least privilege)
4. ✅ Use separate test accounts (not production)
5. ✅ Enable CloudWatch Logs encryption
6. ✅ Rotate test credentials periodically
7. ✅ Review Lambda logs for security issues

## Uninstall

To remove all AWS resources:

```bash
# Delete CloudFormation stack
npx cdk destroy

# Delete secrets (optional)
aws secretsmanager delete-secret --secret-id qa-automation/test-user-email --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id qa-automation/test-user-password --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id qa-automation/active-sub-email --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id qa-automation/inactive-sub-email --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id qa-automation/slack-webhook-url --force-delete-without-recovery

# Delete S3 bucket (manual - must empty first)
aws s3 rm s3://qa-automation-reports-123456789012 --recursive
aws s3 rb s3://qa-automation-reports-123456789012
```

## Next Steps

- [ ] Set up CloudWatch alarms for Lambda failures
- [ ] Configure SNS for email notifications on failures
- [ ] Add more test cases as needed
- [ ] Schedule regular credential rotation
- [ ] Document test account creation process
- [ ] Set up staging environment for testing changes

## Support

For issues or questions:
1. Check CloudWatch Logs for errors
2. Review this guide's Troubleshooting section
3. Check AWS Lambda documentation
4. Verify test accounts are active and valid
