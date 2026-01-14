import { test, expect } from '@playwright/test';
import { loginWithWordPress, getEnvVariable } from '../helpers/test-utils';

test('Login - WordPress Password', async ({ page }) => {
  const email = await getEnvVariable('TEST_USER_EMAIL');
  const password = await getEnvVariable('TEST_USER_PASSWORD');
  
  console.log(`Testing WordPress login with email: ${email}`);

  await loginWithWordPress(page, email, password);
  
  // Verify successful login - check for user menu or dashboard
  await expect(page.getByRole('button', { name: /account|profile|my account/i })).toBeVisible({ timeout: 10000 });
  
  console.log('WordPress login completed successfully.');
});
