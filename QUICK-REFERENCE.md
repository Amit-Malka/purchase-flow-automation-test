# Quick Reference Card

One-page reference for common operations.

## 🚀 First Time Setup

```bash
# 1. Install
npm install
npx playwright install chromium

# 2. Configure
cp env.example.txt .env
# Edit .env with your credentials

# 3. Setup Google (one-time)
npm run setup:google

# 4. Test locally
npm test

# 5. Deploy to AWS
npx cdk bootstrap          # First time only
.\scripts\setup-secrets.ps1  # Windows
npm run deploy
```

## 📝 Common Commands

```bash
# Testing
npm test                           # Run all tests
npm run test:ui                    # Interactive mode
npm run test:auth                  # Auth tests only
npm run test:purchase              # Purchase tests only
npm run test:report                # View results
npm run setup:google               # Setup Google auth

# Deployment
npm run deploy                     # Deploy to AWS
npm run destroy                    # Remove AWS resources
npm run synth                      # Generate CloudFormation

# Debugging
npx playwright test --debug        # Debug mode
npx playwright test --headed       # See browser
npx playwright test [file]         # Run specific test
```

## 📂 File Locations

| What | Where |
|------|-------|
| Tests | `tests/auth/` and `tests/purchase/` |
| Test utilities | `tests/helpers/test-utils.ts` |
| Lambda handler | `src/lambda-handler.ts` |
| Slack reporter | `src/slack-reporter.ts` |
| AWS stack | `cdk/lib/qa-stack.ts` |
| Config | `playwright.config.ts` |
| Env template | `env.example.txt` |
| Google auth | `src/auth-state/google.json` |

## 🧪 Test Files

| Flow | File |
|------|------|
| Regular signup | `tests/purchase/signup-regular.spec.ts` |
| URL coupon (NY1VUIAL) | `tests/purchase/signup-url-coupon.spec.ts` |
| Omni coupon (OMNI1234) | `tests/purchase/signup-omni-coupon.spec.ts` |
| Subscription renewal | `tests/purchase/renew-subscription.spec.ts` |
| WordPress login | `tests/auth/login-wordpress.spec.ts` |
| Google login | `tests/auth/login-google.spec.ts` |
| Active subscription | `tests/auth/login-active-sub.spec.ts` |
| Inactive subscription | `tests/auth/login-inactive-sub.spec.ts` |

## 🔑 Environment Variables

```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=YourPassword123
ACTIVE_SUB_EMAIL=active@example.com
INACTIVE_SUB_EMAIL=inactive@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX
```

## ☁️ AWS Resources

| Resource | Purpose |
|----------|---------|
| Lambda Function | Runs Playwright tests |
| EventBridge Rule | Daily 10am trigger |
| S3 Bucket | Test reports storage |
| Secrets Manager | Secure credentials |
| CloudWatch Logs | Lambda execution logs |

## 🔧 AWS CLI Commands

```bash
# Invoke Lambda manually
aws lambda invoke --function-name [NAME] --payload '{}' response.json

# View logs
aws logs tail /aws/lambda/[NAME] --follow

# List secrets
aws secretsmanager list-secrets --query 'SecretList[?starts_with(Name, `qa-automation`)].Name'

# Update secret
aws secretsmanager update-secret --secret-id qa-automation/test-user-email --secret-string "new@email.com"

# Check Lambda status
aws lambda get-function --function-name [NAME]

# List S3 reports
aws s3 ls s3://qa-automation-reports-[ACCOUNT]/
```

## 📊 CloudFormation Stack

Stack Name: `QaAutomationStack`

```bash
# View stack
aws cloudformation describe-stacks --stack-name QaAutomationStack

# Get outputs
aws cloudformation describe-stacks --stack-name QaAutomationStack --query 'Stacks[0].Outputs'

# Delete stack
npm run destroy
```

## 🕐 Change Schedule

Edit `cdk/lib/qa-stack.ts`:

```typescript
schedule: events.Schedule.cron({
  minute: '0',
  hour: '15',  // 10am EST = 15 UTC
})
```

Then: `npm run deploy`

**Common timezones:**
- 10am EST (UTC-5): `hour: '15'`
- 10am PST (UTC-8): `hour: '18'`
- 10am GMT: `hour: '10'`

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Tests fail locally | Check `.env` credentials |
| Google auth fails | Run `npm run setup:google` |
| Lambda timeout | Increase timeout in `qa-stack.ts` |
| No Slack message | Verify webhook URL |
| Permission denied | Check IAM policy in `qa-stack.ts` |
| Can't find function | Check CloudFormation outputs |

## 📖 Documentation

- **README.md** - Full documentation
- **QUICKSTART.md** - 10-minute setup
- **DEPLOYMENT.md** - Detailed deployment guide
- **TESTING-CHECKLIST.md** - Pre-deployment checklist
- **IMPLEMENTATION-SUMMARY.md** - Project overview

## 💡 Pro Tips

1. **Test locally first** before deploying
2. **Check CloudWatch logs** for Lambda issues
3. **Use `--headed` flag** to debug selector issues
4. **Run tests 2-3 times** to catch flaky tests
5. **Monitor AWS costs** in Billing dashboard
6. **Keep test accounts separate** from production
7. **Rotate credentials monthly** for security

## 🔗 Useful Links

- Playwright Docs: https://playwright.dev
- AWS CDK Docs: https://docs.aws.amazon.com/cdk/
- Slack Webhooks: https://api.slack.com/messaging/webhooks
- AWS Console: https://console.aws.amazon.com

## 📱 Slack Webhook Setup

1. https://api.slack.com/apps
2. Create New App → From scratch
3. Incoming Webhooks → Activate
4. Add to workspace
5. Copy webhook URL
6. Add to `.env` or AWS Secrets

## 🎯 Success Indicators

✅ All tests pass locally
✅ Lambda deploys successfully
✅ Slack notification received
✅ CloudWatch logs show no errors
✅ Tests run daily on schedule
✅ Costs stay under $10/month

## ⚡ Emergency Commands

```bash
# Stop scheduled runs
aws events disable-rule --name QaDailySchedule

# Enable scheduled runs
aws events enable-rule --name QaDailySchedule

# Delete everything
npm run destroy

# Re-deploy from scratch
npm run deploy
```

## 📋 Pre-Deployment Checklist

- [ ] `.env` configured
- [ ] Tests pass locally
- [ ] Slack webhook created
- [ ] Google auth setup
- [ ] AWS CLI configured
- [ ] CDK bootstrapped
- [ ] Secrets uploaded

## 💰 Cost Tracking

Expected: **~$8-9/month**

- Lambda: ~$6/month
- S3: ~$0.02/month
- Secrets Manager: ~$2/month

Monitor: AWS Billing Dashboard

---

**Need Help?** Check README.md or DEPLOYMENT.md for details.
