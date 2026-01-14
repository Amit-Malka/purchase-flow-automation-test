import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  fillEmailAndContinue,
  fillPasswordAndContinue,
  fillPersonalDetails,
  fillStripeCheckout,
  clickJoinNow,
  navigateToCheckout,
  waitForSuccess,
} from '../helpers/test-utils';

test('Sign Up - Regular Subscription (No Coupon)', async ({ page }) => {
  const userData = generateTestUser();
  console.log(`Starting test with email: ${userData.email}`);

  await navigateToCheckout(page);
  await clickJoinNow(page);
  await fillEmailAndContinue(page, userData.email);
  await fillPasswordAndContinue(page, userData.password);
  await fillPersonalDetails(page, userData);
  await fillStripeCheckout(page, userData);
  await waitForSuccess(page);
  
  console.log('Regular signup completed successfully.');
});
