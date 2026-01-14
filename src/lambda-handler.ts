import { Handler } from 'aws-lambda';
import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium } from 'playwright-core';
import * as path from 'path';
import * as fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { sendSlackReport } from './slack-reporter';
import { loadEnvironmentFromSecrets, setupGoogleAuthState } from './secrets-loader';

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  duration: number;
}

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler: Handler = async (event, context) => {
  console.log('Starting QA tests...');
  
  // Set HOME environment variable to /tmp for Playwright
  process.env.HOME = '/tmp';
  
  // Load secrets from AWS Secrets Manager
  await loadEnvironmentFromSecrets();
  
  // Setup Google Auth State
  const googleAuthPath = await setupGoogleAuthState();
  if (googleAuthPath) {
    process.env.GOOGLE_AUTH_STATE_PATH = googleAuthPath;
  }

  // Setup Chromium for Playwright CLI
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = await chromium.executablePath();
  process.env.PLAYWRIGHT_LAUNCH_ARGS = JSON.stringify(chromium.args);

  const results: TestResult[] = [];
  const startTime = Date.now();

  try {
    // Import and run Playwright tests via CLI
    const { runTests } = await import('./test-runner');
    const testResults = await runTests();
    
    results.push(...testResults);
  } catch (error) {
    console.error('Error running tests:', error);
    results.push({
      title: 'Test Execution Error',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      duration: 0,
    });
  }

  const totalDuration = Date.now() - startTime;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`Tests completed: ${passed} passed, ${failed} failed`);

  // Upload reports to S3
  if (process.env.REPORTS_BUCKET) {
    try {
      await uploadReportsToS3(process.env.REPORTS_BUCKET, startTime);
    } catch (error) {
      console.error('Error uploading reports to S3:', error);
    }
  }

  // Send Slack report
  try {
    await sendSlackReport(results, {
      passed,
      failed,
      total: results.length,
      duration: totalDuration,
    });
  } catch (error) {
    console.error('Error sending Slack report:', error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'QA tests completed',
      results: {
        passed,
        failed,
        total: results.length,
        duration: totalDuration,
      },
    }),
  };
};

async function uploadReportsToS3(bucketName: string, timestamp: number) {
  const dateStr = new Date(timestamp).toISOString().split('T')[0];
  const testResultsDir = path.join(process.cwd(), 'playwright-report'); 

  if (!fs.existsSync(testResultsDir)) {
    console.log(`No test results directory found at ${testResultsDir} to upload.`);
    return;
  }

  async function uploadDirectory(dir: string, prefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const s3Key = `${prefix}/${entry.name}`;

      if (entry.isDirectory()) {
        await uploadDirectory(fullPath, s3Key);
      } else {
        const fileContent = fs.readFileSync(fullPath);
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileContent,
          ContentType: getContentType(entry.name),
        }));
      }
    }
  }

  // Upload to S3 under a date-based prefix
  const s3Prefix = `reports/${dateStr}/${timestamp}`;
  await uploadDirectory(testResultsDir, s3Prefix);
  console.log(`Successfully uploaded reports to S3 bucket ${bucketName} under prefix ${s3Prefix}`);
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg': return 'image/jpeg';
    case '.webm': return 'video/webm';
    case '.txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}
