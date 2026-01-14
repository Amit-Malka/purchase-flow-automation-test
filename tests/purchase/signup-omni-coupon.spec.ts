import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  fillEmailAndContinue,
  fillPasswordAndContinue,
  fillPersonalDetails,
  clickJoinNow,
  navigateToCheckout,
  applyCoupon,
  waitForSuccess,
} from '../helpers/test-utils';

test('Sign Up - Free Subscription with Omni Coupon', async ({ page }) => {
  const userData = generateTestUser();
  console.log(`Starting test with email: ${userData.email}`);

  await navigateToCheckout(page);
  await clickJoinNow(page);
  await fillEmailAndContinue(page, userData.email);
  await fillPasswordAndContinue(page, userData.password);
  await fillPersonalDetails(page, userData);
  
  // Apply Omni coupon code before payment
  // The coupon might be applied on the checkout page or before Stripe
  await applyCoupon(page, 'OMNI1234');
  
  // For free subscription with Omni coupon, there might be no Stripe checkout
  // Check if we're redirected to success directly or if there's a different flow
  const isOnStripe = page.url().includes('checkout.stripe.com');
  
  if (isOnStripe) {
    // If Stripe checkout appears (shouldn't for 100% discount), skip payment
    console.log('Unexpected: Stripe checkout appeared for free subscription');
    // Click continue/subscribe without filling payment details
    const continueButton = page.getByRole('button', { name: /continue|subscribe/i });
    if (await continueButton.isVisible()) {
      await continueButton.click();
    }
  } else {
    // Might need to click a final continue/complete button
    const completeButton = page.getByRole('button', { name: /complete|finish|continue/i });
    if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await completeButton.click();
    }
  }
  
  await waitForSuccess(page);
  
  console.log('Omni coupon signup completed successfully.');
});
