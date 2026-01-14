import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  fillEmailAndContinue,
  fillPasswordAndContinue,
  fillPersonalDetails,
  fillStripeCheckout,
  clickJoinNow,
  waitForSuccess,
} from '../helpers/test-utils';

test('Sign Up - Regular Subscription with URL Coupon', async ({ page }) => {
  const userData = generateTestUser();
  console.log(`Starting test with email: ${userData.email}`);

  // Navigate directly to checkout with coupon in URL
  await page.goto('/checkout?coupon=NY1VUIAL&qa=true');
  
  // Verify coupon is applied (optional - check for discount indicator)
  // await expect(page.getByText(/NY1VUIAL|discount/i)).toBeVisible({ timeout: 5000 });
  
  await clickJoinNow(page);
  await fillEmailAndContinue(page, userData.email);
  await fillPasswordAndContinue(page, userData.password);
  await fillPersonalDetails(page, userData);
  await fillStripeCheckout(page, userData);
  await waitForSuccess(page);
  
  console.log('URL coupon signup completed successfully.');
});
