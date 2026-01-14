# Testing Checklist

Use this checklist before deploying to production or when testing locally.

## Pre-Deployment Checklist

### Environment Setup
- [ ] `.env` file created from `env.example.txt`
- [ ] All test account credentials added to `.env`
- [ ] Test accounts verified to be active
- [ ] Slack webhook created and added to `.env`
- [ ] Google auth state saved (if testing Google login)

### Local Testing
- [ ] Dependencies installed: `npm install`
- [ ] Playwright browsers installed: `npx playwright install chromium`
- [ ] All tests pass locally: `npm test`
- [ ] No flaky tests (run tests 2-3 times to verify)
- [ ] Test report generated successfully: `npm run test:report`

### AWS Setup
- [ ] AWS CLI installed and configured
- [ ] CDK CLI installed globally
- [ ] CDK bootstrapped: `npx cdk bootstrap`
- [ ] Secrets uploaded to AWS Secrets Manager
- [ ] Secrets verified in AWS console

### Slack Integration
- [ ] Slack app created
- [ ] Incoming webhook enabled
- [ ] Webhook URL tested with curl
- [ ] Correct channel selected for notifications

## Test Coverage Verification

### Purchase Flow Tests

#### 1. Regular Signup (No Coupon)
**File:** `tests/purchase/signup-regular.spec.ts`

- [ ] Navigates to homepage with `?qa=true`
- [ ] Clicks "Join Now" button
- [ ] Fills unique email address
- [ ] Fills password
- [ ] Fills first and last name
- [ ] Accepts terms of service
- [ ] Selects country
- [ ] Redirects to Stripe checkout
- [ ] Fills payment details (test card 4242...)
- [ ] Submits payment
- [ ] Redirects to success page
- [ ] Test completes without errors

#### 2. Signup with URL Coupon
**File:** `tests/purchase/signup-url-coupon.spec.ts`

- [ ] Navigates to `/checkout?coupon=NY1VUIAL`
- [ ] Coupon is pre-applied or visible
- [ ] Completes signup flow
- [ ] Payment reflects discount (if applicable)
- [ ] Success page reached

#### 3. Signup with Omni Coupon (Free)
**File:** `tests/purchase/signup-omni-coupon.spec.ts`

- [ ] Starts normal signup flow
- [ ] Applies OMNI1234 coupon code
- [ ] No payment required (100% discount)
- [ ] OR minimal Stripe interaction
- [ ] Success page reached

#### 4. Subscription Renewal
**File:** `tests/purchase/renew-subscription.spec.ts`

⚠️ **Manual Step Required:** Expire a test subscription before running this test

- [ ] Test subscription expired manually
- [ ] Logs in with expired account
- [ ] Sees renewal/upgrade prompt
- [ ] Clicks renew button
- [ ] Completes payment
- [ ] Subscription reactivated
- [ ] Success confirmation

### Authentication Flow Tests

#### 5. WordPress Password Login
**File:** `tests/auth/login-wordpress.spec.ts`

- [ ] TEST_USER_EMAIL env var set
- [ ] TEST_USER_PASSWORD env var set
- [ ] Navigates to site
- [ ] Clicks login button
- [ ] Fills email
- [ ] Fills password
- [ ] Submits login
- [ ] User account menu visible
- [ ] No error messages

#### 6. Google OAuth Login
**File:** `tests/auth/login-google.spec.ts`

- [ ] Google auth state file exists (`src/auth-state/google.json`)
- [ ] If missing, run: `npm run setup:google`
- [ ] Creates browser context with saved auth
- [ ] Navigates to site
- [ ] Already logged in (no login flow)
- [ ] User account menu visible

#### 7. Active Subscription Access
**File:** `tests/auth/login-active-sub.spec.ts`

- [ ] ACTIVE_SUB_EMAIL env var set
- [ ] User has active subscription in system
- [ ] Logs in successfully
- [ ] No paywall or upgrade prompts
- [ ] Can access protected content
- [ ] Navigates to `/webinars` without issues

#### 8. Inactive Subscription Handling
**File:** `tests/auth/login-inactive-sub.spec.ts`

- [ ] INACTIVE_SUB_EMAIL env var set
- [ ] User has expired/pending subscription
- [ ] Logs in successfully
- [ ] Sees upgrade/renewal prompt
- [ ] OR restricted content access
- [ ] Appropriate messaging displayed

## Post-Deployment Verification

### Lambda Function
- [ ] Lambda deployed successfully
- [ ] Function shows "Active" status in AWS console
- [ ] Environment variables configured
- [ ] IAM role has correct permissions
- [ ] Memory set to 2048 MB
- [ ] Timeout set to 5 minutes

### EventBridge Rule
- [ ] Schedule rule created
- [ ] Cron expression correct (default: 0 10 * * ? *)
- [ ] Rule status: Enabled
- [ ] Target set to Lambda function

### S3 Bucket
- [ ] Bucket created with correct name
- [ ] Lifecycle policy set (30-day expiration)
- [ ] Lambda has write permissions

### Secrets Manager
- [ ] All 5 secrets created:
  - `qa-automation/test-user-email`
  - `qa-automation/test-user-password`
  - `qa-automation/active-sub-email`
  - `qa-automation/inactive-sub-email`
  - `qa-automation/slack-webhook-url`
- [ ] Lambda has read permissions

### Manual Lambda Test
```bash
aws lambda invoke \
  --function-name YOUR_FUNCTION_NAME \
  --payload '{}' \
  response.json

cat response.json
```

- [ ] Lambda invocation succeeds
- [ ] Response shows test results
- [ ] CloudWatch logs show test execution
- [ ] Slack notification received
- [ ] No errors in logs

### CloudWatch Logs
- [ ] Log group created: `/aws/lambda/QaAutomationStack-QaTestsLambdaXXXX`
- [ ] Logs show test execution
- [ ] No error messages or stack traces
- [ ] Secrets loaded successfully
- [ ] Slack report sent successfully

### Slack Notification
- [ ] Message received in correct channel
- [ ] Shows test summary (passed/failed/total)
- [ ] Individual test results listed
- [ ] Checkmarks (✅) for passed tests
- [ ] X marks (❌) for failed tests
- [ ] Error messages for failures (if any)
- [ ] Timestamp and duration shown

## Monitoring Checklist

### Daily Checks (First Week)
- [ ] Check Slack for daily test reports
- [ ] Verify all tests passing
- [ ] Review any failures immediately
- [ ] Check CloudWatch logs for errors

### Weekly Checks
- [ ] Review test execution duration
- [ ] Check Lambda costs in AWS Billing
- [ ] Verify no timeout issues
- [ ] Review S3 bucket size

### Monthly Checks
- [ ] Rotate test account passwords
- [ ] Review and update test cases
- [ ] Check AWS costs (should be ~$6-7/month)
- [ ] Verify all test accounts still active

## Troubleshooting Guide

### Test Fails: "Environment variable not set"
- [ ] Check secrets in AWS Secrets Manager
- [ ] Verify Lambda IAM permissions
- [ ] Check Lambda logs for specific secret name

### Test Fails: "Timeout waiting for selector"
- [ ] Check if site is accessible
- [ ] Verify selector hasn't changed
- [ ] Increase timeout in test
- [ ] Run locally to debug

### Test Fails: "Authentication failed"
- [ ] Verify test account credentials
- [ ] Check if account is locked/deactivated
- [ ] Try logging in manually
- [ ] Reset password if needed

### No Slack Notification
- [ ] Verify webhook URL in Secrets Manager
- [ ] Check Lambda logs for Slack errors
- [ ] Test webhook with curl
- [ ] Verify Slack app still installed

### Lambda Timeout
- [ ] Check test duration in logs
- [ ] Increase Lambda timeout
- [ ] Optimize slow tests
- [ ] Check for network issues

## Test Account Management

### Required Test Accounts

1. **Regular Test Account**
   - Email: `TEST_USER_EMAIL`
   - Password: `TEST_USER_PASSWORD`
   - Status: No subscription
   - Used for: WordPress login test

2. **Active Subscription Account**
   - Email: `ACTIVE_SUB_EMAIL`
   - Password: `TEST_USER_PASSWORD`
   - Status: Active paid subscription
   - Used for: Active subscription access test

3. **Inactive Subscription Account**
   - Email: `INACTIVE_SUB_EMAIL`
   - Password: `TEST_USER_PASSWORD`
   - Status: Expired or pending subscription
   - Used for: Inactive subscription test, renewal test

4. **Google OAuth Account**
   - Saved in: `src/auth-state/google.json`
   - Used for: Google login test
   - Refresh: Run `npm run setup:google` if expired

### Account Maintenance
- [ ] All accounts created and documented
- [ ] Passwords stored securely
- [ ] Subscriptions in correct states
- [ ] Google auth refreshed if needed

## Cost Monitoring

### Expected Monthly Costs
- Lambda executions: ~$0.20/day × 30 = $6.00
- S3 storage: ~$0.02
- Secrets Manager: $0.40/secret × 5 = $2.00
- EventBridge: Free
- **Total: ~$8-9/month**

### Cost Alerts
- [ ] AWS Budget set up
- [ ] Alert threshold: $15/month
- [ ] Notification email configured

## Security Checklist

- [ ] No credentials committed to git
- [ ] `.env` in `.gitignore`
- [ ] `src/auth-state/google.json` in `.gitignore`
- [ ] AWS Secrets Manager used for production
- [ ] Lambda has minimal IAM permissions
- [ ] Test accounts isolated from production
- [ ] Regular password rotation scheduled

## Performance Benchmarks

### Expected Test Duration (Local)
- Regular signup: ~30-45 seconds
- Signup with coupon: ~30-45 seconds
- Omni coupon: ~25-40 seconds
- WordPress login: ~10-15 seconds
- Google login: ~5-10 seconds
- Active subscription: ~15-20 seconds
- Inactive subscription: ~15-20 seconds
- Renewal: ~35-50 seconds

**Total: ~3-4 minutes for all tests**

### Expected Lambda Duration
- With cold start: ~60-90 seconds
- Warm start: ~30-60 seconds
- Over 5 minutes: ⚠️ Investigate

## Success Criteria

✅ All tests pass locally
✅ All tests pass in Lambda
✅ Slack notifications received
✅ No timeout errors
✅ Costs within budget
✅ Tests run daily on schedule
✅ No manual intervention required

## Next Steps After Successful Deployment

1. Monitor for 1 week
2. Address any flaky tests
3. Add more test cases as needed
4. Set up CloudWatch alarms
5. Configure SNS for email notifications
6. Document any site changes that affect tests
7. Schedule quarterly review of test coverage
