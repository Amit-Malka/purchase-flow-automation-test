import { test, expect } from '@playwright/test';
import { loginWithWordPress, getEnvVariable } from '../helpers/test-utils';

test('Login - Inactive Subscription (Pending/Expired)', async ({ page }) => {
  const email = await getEnvVariable('INACTIVE_SUB_EMAIL');
  const password = await getEnvVariable('TEST_USER_PASSWORD');
  
  console.log(`Testing inactive subscription login with email: ${email}`);

  await loginWithWordPress(page, email, password);
  
  // Verify successful login
  await expect(page.getByRole('button', { name: /account|profile|my account/i })).toBeVisible({ timeout: 10000 });
  
  // Navigate to a protected page
  await page.goto('/webinars');
  
  // Verify subscription prompt appears for inactive users
  // This could be a modal, banner, or redirect to upgrade page
  const upgradePrompt = page.locator('[role="dialog"]').filter({ hasText: /subscribe|upgrade|renew|expired/i });
  const upgradeBanner = page.getByText(/subscribe to access|upgrade to view|subscription expired|renew/i);
  
  const hasUpgradePrompt = await upgradePrompt.isVisible({ timeout: 5000 }).catch(() => false);
  const hasUpgradeBanner = await upgradeBanner.isVisible({ timeout: 5000 }).catch(() => false);
  
  expect(hasUpgradePrompt || hasUpgradeBanner).toBeTruthy();
  
  console.log('Inactive subscription login verified successfully.');
});
