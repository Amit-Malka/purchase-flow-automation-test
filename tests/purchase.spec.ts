import { test, expect } from '@playwright/test';

test('Purchase flow success', async ({ page }) => {
  // 1. Setup Data
  // Create a truly unique email with timestamp and random number
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const email = `test${timestamp}${random}@testlegacy.com`;
  const password = 'TestUser@1234';
  const firstName = 'John';
  const lastName = 'Doe';
  const country = 'United States';
  const zipCode = '90210';

  console.log(`Starting test with email: ${email}`);

  // 2. Navigate
  await page.goto('/?qa=true');

  // 3. Click Join Now
  await page.getByText('Join Now', { exact: false }).first().click();

  // 4. Fill Email and Continue
  await page.locator('input[type="email"]').fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // 5. Fill Password
  await page.locator('input[type="password"]').fill(password);
  
  // 6. Continue (from Password screen)
  await page.getByRole('dialog').getByRole('button', { name: 'Continue', exact: true }).click();

  // 7. Personal Details (New Step)
  // Fill First Name
  await page.getByLabel('First name').fill(firstName);
  
  // Fill Last Name
  await page.getByLabel('Last name').fill(lastName);

  // Accept Terms (Moved before Country selection)
  // Targeting the text directly to handle custom-styled checkboxes
  await page.getByText(/confirm that you accept our Terms of Use/i).click();
  
  // Select Country
  // Click the country field to reveal options
  await page.getByLabel('Country').click();
  // Select United States from the presented options
  await page.getByText('United States', { exact: true }).click();

  // Continue to Checkout
  await page.getByRole('button', { name: /continue|checkout|next/i }).click();

  // 8. Stripe Interaction (Hosted Checkout)
  // Wait for the redirection to the Stripe Checkout page
  await page.waitForURL(/checkout.stripe.com/);

  // Fill Card Number
  // On hosted checkout, fields are often in the main frame or accessible directly
  await page.locator('input[placeholder="1234 1234 1234 1234"], input[autocomplete="cc-number"]').fill('4242424242424242');
  
  // Fill Expiry
  await page.locator('input[placeholder="MM / YY"]').fill('12/32');

  // Fill CVC
  await page.locator('input[placeholder="CVC"]').fill('444');

  // Fill Name on Card
  await page.locator('input[placeholder="Full name on card"]').fill(`${firstName} ${lastName}`);

  // Fill Zip Code
  // Zip code might be hidden/optional depending on the country selected, or labeled differently
  // We try to fill it if found.
  const zipLocator = page.locator('input[name="postal"], input[placeholder="ZIP"]');
  if (await zipLocator.isVisible()) {
      await zipLocator.fill(zipCode);
  }

  // 9. Submit Payment
  // The Subscribe button is usually on the main page, not in the iframe
  await page.getByRole('button', { name: 'Subscribe', exact: true }).click();

  // 10. Verify Success
  await expect(page).toHaveURL(/success/i, { timeout: 30000 });
  
  console.log('Purchase flow completed successfully.');
});