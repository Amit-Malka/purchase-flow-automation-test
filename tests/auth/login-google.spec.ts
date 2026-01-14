import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = process.env.GOOGLE_AUTH_STATE_PATH || path.join(__dirname, '../../src/auth-state/google.json');

test('Login - Google OAuth', async ({ browser }) => {
  // Check if auth state file exists
  if (!fs.existsSync(authFile)) {
    throw new Error(
      `Google auth state file not found at ${authFile}. ` +
      'Please run: npx playwright test --project=setup-google-auth'
    );
  }

  console.log('Using saved Google authentication state');

  // Create context with saved auth state
  const context = await browser.newContext({
    storageState: authFile,
  });

  const page = await context.newPage();

  // Navigate to the site - should be already logged in
  await page.goto('/?qa=true');

  // Verify user is logged in
  await expect(page.getByRole('button', { name: /account|profile|my account/i })).toBeVisible({ timeout: 10000 });

  console.log('Google login verified successfully using saved auth state.');

  await context.close();
});
