import { test, expect } from '@playwright/test';
import {
  getEnvVariable,
  loginWithWordPress,
  fillStripeCheckout,
  waitForSuccess,
} from '../helpers/test-utils';

test('Renew Expired Subscription (Re-purchase)', async ({ page }) => {
  // This test requires a user with an expired subscription
  // The user should notify when they've expired a subscription for testing
  const email = await getEnvVariable('INACTIVE_SUB_EMAIL');
  const password = await getEnvVariable('TEST_USER_PASSWORD');
  
  console.log(`Testing subscription renewal with email: ${email}`);

  // Login with expired subscription account
  await loginWithWordPress(page, email, password);
  
  // Navigate to a page that should trigger the renewal/upgrade prompt
  await page.goto('/webinars');
  
  // Look for and click on "Renew", "Subscribe", or "Upgrade" button
  const renewButton = page.getByRole('button', { name: /renew|subscribe|upgrade|reactivate/i }).first();
  await expect(renewButton).toBeVisible({ timeout: 10000 });
  await renewButton.click();
  
  // Should be taken to checkout or payment page
  // Wait for either Stripe checkout or internal checkout page
  await page.waitForTimeout(2000); // Brief wait for navigation
  
  const isOnStripe = page.url().includes('checkout.stripe.com');
  const isOnCheckout = page.url().includes('checkout');
  
  if (!isOnStripe && !isOnCheckout) {
    // Might need to select a plan first
    const selectPlanButton = page.getByRole('button', { name: /select|choose|continue/i }).first();
    if (await selectPlanButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await selectPlanButton.click();
    }
  }
  
  // Fill payment details
  const userData = {
    firstName: 'Test',
    lastName: 'Renewal',
    zipCode: '90210',
  };
  
  await fillStripeCheckout(page, userData);
  await waitForSuccess(page);
  
  console.log('Subscription renewal completed successfully.');
});
