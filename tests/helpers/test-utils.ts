import { Page } from '@playwright/test';

export interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country?: string;
  zipCode?: string;
}

export function generateTestUser(): UserData {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return {
    email: `test${timestamp}${random}@testlegacy.com`,
    password: 'TestUser@1234',
    firstName: 'John',
    lastName: 'Doe',
    country: 'United States',
    zipCode: '90210',
  };
}

export async function fillEmailAndContinue(page: Page, email: string): Promise<void> {
  await page.locator('input[type="email"]').fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

export async function fillPasswordAndContinue(page: Page, password: string): Promise<void> {
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('dialog').getByRole('button', { name: 'Continue', exact: true }).click();
}

export async function fillPersonalDetails(page: Page, userData: UserData): Promise<void> {
  await page.getByLabel('First name').fill(userData.firstName);
  await page.getByLabel('Last name').fill(userData.lastName);
  
  await page.getByText(/confirm that you accept our Terms of Use/i).click();
  
  if (userData.country) {
    await page.getByLabel('Country').click();
    await page.getByText(userData.country, { exact: true }).click();
  }
  
  await page.getByRole('button', { name: /continue|checkout|next/i }).click();
}

export async function fillStripeCheckout(
  page: Page,
  userData: UserData,
  cardNumber: string = '4242424242424242'
): Promise<void> {
  await page.waitForURL(/checkout.stripe.com/);
  
  await page.locator('input[placeholder="1234 1234 1234 1234"], input[autocomplete="cc-number"]').fill(cardNumber);
  await page.locator('input[placeholder="MM / YY"]').fill('12/32');
  await page.locator('input[placeholder="CVC"]').fill('444');
  await page.locator('input[placeholder="Full name on card"]').fill(`${userData.firstName} ${userData.lastName}`);
  
  const zipLocator = page.locator('input[name="postal"], input[placeholder="ZIP"]');
  if (await zipLocator.isVisible()) {
    await zipLocator.fill(userData.zipCode || '90210');
  }
  
  await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
}

export async function clickJoinNow(page: Page): Promise<void> {
  await page.getByText('Join Now', { exact: false }).first().click();
}

export async function navigateToCheckout(page: Page, coupon?: string): Promise<void> {
  const url = coupon ? `/checkout?coupon=${coupon}` : '/?qa=true';
  await page.goto(url);
}

export async function applyCoupon(page: Page, couponCode: string): Promise<void> {
  const couponInput = page.locator('input[name="coupon"], input[placeholder*="coupon" i]');
  if (await couponInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await couponInput.fill(couponCode);
    const applyButton = page.getByRole('button', { name: /apply|add/i });
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
  }
}

export async function loginWithWordPress(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/?qa=true');
  
  const loginButton = page.getByRole('button', { name: /log in|sign in/i }).first();
  await loginButton.click();
  
  await page.locator('input[type="email"]').fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /log in|sign in|continue/i }).click();
}

export async function waitForSuccess(page: Page): Promise<void> {
  await page.waitForURL(/success/i, { timeout: 30000 });
}

export async function getEnvVariable(key: string): Promise<string> {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
