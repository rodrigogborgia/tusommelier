import { test, expect, type Page, type Route } from "@playwright/test";

async function clickCutButtonResilient(page: Page) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (page.isClosed()) {
      throw new Error("Page was closed before completing cut button click");
    }

    const byRole = page.getByRole("button", { name: /Cortar llamada/i });

    try {
      await expect(byRole).toBeVisible({ timeout: 1500 });
      await byRole.tap({ timeout: 1500 });
      return;
    } catch (error) {
      lastError = error;
    }

    try {
      const forced = page.locator('button[aria-label="Cortar llamada"]');
      await forced.click({ force: true, timeout: 1500 });
      return;
    } catch (error) {
      lastError = error;
    }

    try {
      const forced = page.locator('button[aria-label="Cortar llamada"]');
      await forced.dispatchEvent("click");
      return;
    } catch (error) {
      lastError = error;
    }

    if (attempt < 3) {
      await page.waitForTimeout(150 * attempt);
    }
  }

  throw lastError;
}

async function mockConversationSuccess(page: Page) {
  await page.route("**/conversation", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: "Respuesta mock backend" }),
    });
  });

  await page.route("**/tavus/conversations", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ conversation_url: "https://example.com/mock-conversation" }),
    });
  });
}

test("flujo crítico: iniciar llamada y cortar vuelve al estado inicial", async ({ page, browserName }) => {
  if (browserName === "webkit") {
    test.slow();
  }

  await mockConversationSuccess(page);
  await page.goto("http://localhost:5173");

  const startButton = page.getByRole("button", { name: /Iniciar llamada/i });
  await expect(startButton).toBeVisible();

  await startButton.click();

  const cutButton = page.getByRole("button", { name: /Cortar llamada/i });
  await expect(cutButton).toBeVisible();
  await clickCutButtonResilient(page);

  await expect(startButton).toBeVisible({ timeout: 10000 });
});

test("manejo de error: falla backend /conversation y se muestra alert", async ({ page }) => {
  await page.route("**/conversation", async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ detail: "error simulado" }),
    });
  });

  const dialogPromise = page.waitForEvent("dialog");

  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: /Iniciar llamada/i }).click();

  const dialog = await dialogPromise;
  await expect(dialog.message()).toContain("Error:");
  await dialog.accept();

  await expect(page.getByRole("button", { name: /Iniciar llamada/i })).toBeVisible();
});

test("contexto guardado: muestra botón Retomar", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("tavus_conversational_context", "{\"context\":\"mock\"}");
  });

  await page.goto("http://localhost:5173");

  await expect(page.getByRole("button", { name: /Retomar/i })).toBeVisible();
});
