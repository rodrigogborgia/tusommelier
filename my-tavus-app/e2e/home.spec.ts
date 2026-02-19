import { test, expect } from '@playwright/test';

test('homepage loads and shows app shell', async ({ page }) => {
  await page.goto('http://localhost:5173');
  // basic smoke: check that body exists and has some content
  const body = await page.locator('body').innerText();
  expect(body.length).toBeGreaterThan(0);
});
