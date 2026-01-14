# QA Automation - Purchase Flow

Automated Playwright test for verifying the subscription purchase flow on `ftwebinars.com`.

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   npm install
   npx playwright install
   ```

## 🛠️ Usage

### Run Test (Headless)
Best for CI/CD or background execution.
```bash
npx playwright test
```

### Run Test with UI (Interactive)
See the test running in a browser window.
```bash
npx playwright test --ui
```

### View Report
Check results after a run.
```bash
npx playwright show-report
```

## 🧪 Test Details (`tests/purchase.spec.ts`)

- **Objective:** Validates the complete user journey from landing page to successful subscription.
- **Unique Email Logic:** Uses `test[timestamp][random]@testlegacy.com` to ensure a fresh registration for every run and avoid "account already exists" errors.
- **Payment:** Uses Stripe's standard test card (`4242 4242 4242 4242`) and redirects to the hosted Stripe Checkout page.
- **Key Steps:**
  1. Navigates to the landing page.
  2. Clicks "Join Now" and registers a new account.
  3. Completes the personal details form (Name, Country, Terms).
  4. Redirects to Stripe Checkout.
  5. Fills payment details and Subscribes.
  6. Verifies redirection to the success page.

## ⚙️ Configuration

- **Base URL:** configured in `playwright.config.ts`.
- **Browsers:** Runs on Chromium by default.
