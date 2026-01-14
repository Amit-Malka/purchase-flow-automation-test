import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = path.join(__dirname, '../../src/auth-state/google.json');

setup('Setup Google Authentication', async ({ page }) => {
  console.log('Starting Google auth setup...');
  console.log('MANUAL STEP REQUIRED: Please log in with Google when the browser opens');

  await page.goto('/?qa=true');
  
  // Click login button
  const loginButton = page.getByRole('button', { name: /log in|sign in/i }).first();
  await loginButton.click();
  
  // Wait for email input and click "Continue with Google" or similar
  const googleButton = page.getByRole('button', { name: /google|continue with google/i });
  await googleButton.click();
  
  // Wait for Google OAuth page to load
  await page.waitForURL(/accounts.google.com/, { timeout: 10000 });
  
  console.log('Google login page loaded. Please complete the login manually...');
  console.log('This script will wait for you to complete the login.');
  
  // Wait for redirect back to the site after successful login
  await page.waitForURL(/ftwebinars.com/, { timeout: 120000 }); // 2 minutes for manual login
  
  // Verify login succeeded
  await page.waitForSelector('[role="button"]:has-text("account"), [role="button"]:has-text("profile")', { 
    timeout: 10000 
  });
  
  console.log('Login successful! Saving authentication state...');
  
  // Ensure directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Save storage state
  await page.context().storageState({ path: authFile });
  
  console.log(`Authentication state saved to ${authFile}`);
});
