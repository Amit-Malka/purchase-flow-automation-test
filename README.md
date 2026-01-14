# QA Automation - FT Webinars

Automated Playwright test suite for verifying authentication flows and subscription purchases on `ftwebinars.com`. Deployed to AWS Lambda with daily scheduled runs and Slack notifications.

## 🧪 Test Coverage

### Purchase Flows
1. ✅ Sign Up - Regular Subscription (No Coupon)
2. ✅ Sign Up - Subscription with URL Coupon (NY1VUIAL)
3. ✅ Sign Up - Free Subscription with Omni Coupon (OMNI1234)
4. ✅ Renew Expired Subscription (Re-purchase)

### Authentication Flows
5. ✅ Login - WordPress Password
6. ✅ Login - Google OAuth (using saved auth state)
7. ✅ Login - Active Subscription Access
8. ✅ Login - Inactive Subscription (Pending/Expired)

## 🚀 Local Setup

### 1. Install Dependencies
```bash
npm install
npx playwright install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp env.example.txt .env
```

Edit `.env` and fill in your test credentials:
```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=YourPassword123!
ACTIVE_SUB_EMAIL=active@example.com
INACTIVE_SUB_EMAIL=inactive@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Setup Google Authentication (One-time)
For the Google OAuth test, you need to save authentication state once:
```bash
npx playwright test tests/auth/setup-google-auth.spec.ts --headed
```
This will open a browser where you manually log in with Google. The authentication state will be saved to `src/auth-state/google.json`.

## 🛠️ Usage

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Purchase flows only
npx playwright test tests/purchase/

# Authentication flows only
npx playwright test tests/auth/

# Specific test
npx playwright test tests/purchase/signup-regular.spec.ts
```

### Run Tests with UI (Interactive)
```bash
npm run test:ui
```

### View Test Report
```bash
npx playwright show-report
```

## ☁️ AWS Deployment

### Prerequisites
- AWS CLI installed and configured
- AWS CDK installed: `npm install -g aws-cdk`
- AWS account with appropriate permissions

### 1. Bootstrap CDK (First Time Only)
```bash
npx cdk bootstrap
```

### 2. Setup Secrets in AWS Secrets Manager
Upload your test credentials to AWS Secrets Manager:

**On Windows (PowerShell):**
```powershell
.\scripts\setup-secrets.ps1
```

**On Linux/Mac:**
```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

This will create the following secrets:
- `qa-automation/test-user-email`
- `qa-automation/test-user-password`
- `qa-automation/active-sub-email`
- `qa-automation/inactive-sub-email`
- `qa-automation/slack-webhook-url`

### 3. Deploy to AWS Lambda
```bash
npm run deploy
```

This will:
- Create a Lambda function with Playwright and Chromium
- Set up EventBridge rule to run tests daily at 10am UTC
- Create S3 bucket for test reports
- Configure IAM permissions

### 4. Adjust Timezone (Optional)
The default schedule is 10am UTC. To change this, edit `cdk/lib/qa-stack.ts`:
```typescript
schedule: events.Schedule.cron({
  minute: '0',
  hour: '15',  // For 10am EST (UTC-5)
})
```

Then redeploy:
```bash
npm run deploy
```

### 5. Manual Test Trigger
To test the Lambda function manually:
```bash
aws lambda invoke \
  --function-name $(aws cloudformation describe-stacks --stack-name QaAutomationStack --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' --output text) \
  --payload '{}' \
  response.json

cat response.json
```

## 📊 Slack Notifications

After each test run, a formatted report is sent to Slack with:
- ✅ Passed tests with green checkmarks
- ❌ Failed tests with red X icons
- Summary: passed/failed/total counts
- Execution duration
- Error messages for failed tests

### Setting up Slack Webhook
1. Go to https://api.slack.com/apps
2. Create New App → From scratch
3. Name it "QA Test Reports" and select your workspace
4. Go to "Incoming Webhooks" → Activate
5. Click "Add New Webhook to Workspace"
6. Select the channel for reports
7. Copy the webhook URL and add it to your `.env` or AWS Secrets Manager

## 📁 Project Structure

```
QA-automation/
├── cdk/                        # AWS CDK infrastructure
│   ├── lib/qa-stack.ts         # Lambda, EventBridge, S3
│   ├── bin/cdk.ts
│   └── cdk.json
├── src/
│   ├── lambda-handler.ts       # Lambda entry point
│   ├── test-runner.ts          # Test orchestration
│   ├── slack-reporter.ts       # Slack message formatting
│   ├── secrets-loader.ts       # AWS Secrets Manager integration
│   └── auth-state/             # Saved Google auth state (gitignored)
├── tests/
│   ├── auth/                   # Authentication test specs
│   ├── purchase/               # Purchase flow test specs
│   └── helpers/
│       └── test-utils.ts       # Shared utilities
├── scripts/
│   ├── setup-secrets.sh        # Bash script for AWS secrets
│   └── setup-secrets.ps1       # PowerShell script for AWS secrets
├── playwright.config.ts
└── package.json
```

## 🔧 Configuration

### Playwright Config
- **Base URL:** `https://ftwebinars.com`
- **Timeout:** 60 seconds per test
- **Retries:** 1 (2 on CI)
- **Workers:** 1 (sequential execution)
- **Screenshots:** On failure
- **Videos:** On failure

### Lambda Config
- **Memory:** 2048 MB
- **Timeout:** 5 minutes
- **Runtime:** Node.js 20.x
- **Browser:** Chromium (via @sparticuz/chromium)

## 🐛 Troubleshooting

### Tests fail locally but work in browser
Make sure you're using the correct selectors and the site isn't rate-limiting you.

### Google auth test fails
Re-run the setup: `npx playwright test tests/auth/setup-google-auth.spec.ts --headed`

### Lambda times out
Increase timeout in `cdk/lib/qa-stack.ts`:
```typescript
timeout: cdk.Duration.minutes(10),
```

### Slack notifications not received
Verify webhook URL is correct and the Slack app is installed in your workspace.

## 📝 Notes

- Test emails use format: `test{timestamp}{random}@testlegacy.com`
- Stripe test card: `4242 4242 4242 4242`
- All tests run with `?qa=true` parameter for test mode
- Google auth requires manual setup once, then uses saved state
- Renewal test requires user to manually expire a subscription first

## 🔒 Security

- Never commit `.env` or `src/auth-state/google.json` to git
- Use AWS Secrets Manager for production credentials
- Lambda has IAM permissions limited to Secrets Manager read and S3 write
- Test accounts should be isolated from production

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
