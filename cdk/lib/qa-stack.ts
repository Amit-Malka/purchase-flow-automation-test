import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

export class QaAutomationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for test reports and screenshots
    const reportsBucket = new s3.Bucket(this, 'QaReportsBucket', {
      bucketName: `qa-automation-reports-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // Lambda function for running Playwright tests
    const qaLambda = new lambda.Function(this, 'QaTestsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../'), {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash', '-c',
            [
              'npm ci --omit=dev',
              'cp -r . /asset-output/',
              'cd /asset-output',
              'rm -rf node_modules/@playwright/test/.local-browsers',
            ].join(' && '),
          ],
        },
      }),
      memorySize: 2048,
      timeout: cdk.Duration.minutes(5),
      environment: {
        REPORTS_BUCKET: reportsBucket.bucketName,
        PLAYWRIGHT_BROWSERS_PATH: '/tmp/chromium',
        NODE_ENV: 'production',
      },
    });

    // Grant Lambda permissions to write to S3
    reportsBucket.grantWrite(qaLambda);

    // Grant Lambda permissions to read secrets
    qaLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:qa-automation/*`],
      })
    );

    // EventBridge rule to trigger Lambda at 10am daily (UTC)
    // Adjust the cron expression based on your timezone
    // Format: cron(minutes hours day-of-month month day-of-week year)
    // This example uses 10:00 UTC - adjust as needed
    const rule = new events.Rule(this, 'QaDailySchedule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '10',
        // If you want 10am EST (UTC-5), use hour: '15'
        // If you want 10am PST (UTC-8), use hour: '18'
      }),
      description: 'Trigger QA tests daily at 10am',
    });

    rule.addTarget(new targets.LambdaFunction(qaLambda));

    // Outputs
    new cdk.CfnOutput(this, 'ReportsBucketName', {
      value: reportsBucket.bucketName,
      description: 'S3 bucket for test reports',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: qaLambda.functionName,
      description: 'Lambda function name',
    });
  }
}
