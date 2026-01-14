import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  duration: number;
}

export async function runTests(): Promise<TestResult[]> {
  console.log('Running tests via Playwright CLI...');
  
  const resultsPath = path.join(process.cwd(), 'test-results/results.json');
  
  // Ensure the directory exists
  if (!fs.existsSync(path.dirname(resultsPath))) {
    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  }

  try {
    // Run Playwright CLI
    // We use --reporter=json to get machine-readable results
    // The browser path and args are passed via environment variables
    // which are read in playwright.config.ts
    execSync('npx playwright test --reporter=json', {
      stdio: 'inherit',
      env: {
        ...process.env,
        // Ensure Playwright uses the results file we expect
        PLAYWRIGHT_JSON_OUTPUT_NAME: resultsPath,
      },
    });
  } catch (error) {
    // execSync throws if the command returns a non-zero exit code (which happens if tests fail)
    console.log('Some tests failed (this is expected if any test fails).');
  }

  // Read and parse the results
  if (!fs.existsSync(resultsPath)) {
    throw new Error(`Test results file not found at ${resultsPath}`);
  }

  const resultsJson = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const results: TestResult[] = [];

  // Flatten Playwright's nested JSON structure
  for (const suite of resultsJson.suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          results.push({
            title: spec.title,
            status: result.status,
            error: result.error?.message,
            duration: result.duration,
          });
        }
      }
    }
  }

  return results;
}