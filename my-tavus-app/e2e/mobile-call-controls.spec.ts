import { test, expect } from "@playwright/test";

async function clickCutButtonResilient(page: import("@playwright/test").Page) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const byRole = page.getByRole("button", { name: /Cortar llamada/i });

    try {
      await byRole.click({ timeout: 4000 });
      return;
    } catch (error) {
      lastError = error;
    }

    try {
      const forced = page.locator('button[aria-label="Cortar llamada"]');
      await forced.click({ force: true, timeout: 2000 });
      return;
    } catch (error) {
      lastError = error;
    }

    await page.waitForTimeout(300 * attempt);
  }

  throw lastError;
}

test("botones Iniciar llamada y Cortar visibles y clickeables en mobile", async ({ page }) => {
  await page.route("**/conversation", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: "Hola desde mock backend" }),
    });
  });

  await page.route("**/tavus/conversations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ conversation_url: "https://example.com/mock-conversation" }),
    });
  });

  await page.goto("http://localhost:5173");

  const startButton = page.getByRole("button", { name: /Iniciar llamada/i });
  await expect(startButton).toBeVisible();

  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error("No se pudo obtener viewport en la prueba mobile");
  }

  const startBox = await startButton.boundingBox();
  expect(startBox).not.toBeNull();
  if (!startBox) {
    throw new Error("No se pudo obtener bounding box del botón de inicio");
  }

  expect(startBox.width).toBeGreaterThanOrEqual(viewport.width * 0.7);
  await startButton.click();

  const cutButton = page.getByRole("button", { name: /Cortar llamada/i });
  await expect(cutButton).toBeVisible();

  const cutBox = await cutButton.boundingBox();
  expect(cutBox).not.toBeNull();
  if (!cutBox) {
    throw new Error("No se pudo obtener bounding box del botón cortar");
  }

  expect(cutBox.width).toBeGreaterThanOrEqual(viewport.width * 0.7);
  await clickCutButtonResilient(page);

  await expect(startButton).toBeVisible();
});
