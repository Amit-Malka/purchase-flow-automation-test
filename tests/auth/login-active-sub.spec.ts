import { test, expect } from '@playwright/test';
import { loginWithWordPress, getEnvVariable } from '../helpers/test-utils';

test('Login - Active Subscription', async ({ page }) => {
  const email = await getEnvVariable('ACTIVE_SUB_EMAIL');
  const password = await getEnvVariable('TEST_USER_PASSWORD');
  
  console.log(`Testing active subscription login with email: ${email}`);

  await loginWithWordPress(page, email, password);
  
  // Verify successful login
  await expect(page.getByRole('button', { name: /account|profile|my account/i })).toBeVisible({ timeout: 10000 });
  
  // Verify user has access to content (no paywall)
  // Look for indicators of active subscription
  const paywallModal = page.locator('[role="dialog"]').filter({ hasText: /subscribe|upgrade|join/i });
  await expect(paywallModal).not.toBeVisible({ timeout: 5000 });
  
  // Navigate to a protected page to verify access
  await page.goto('/webinars');
  
  // Verify no subscription prompt appears
  await expect(page.getByText(/subscribe to access|upgrade to view/i)).not.toBeVisible({ timeout: 5000 });
  
  console.log('Active subscription login verified successfully.');
});
