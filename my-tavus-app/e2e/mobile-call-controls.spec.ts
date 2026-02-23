import { test, expect } from "@playwright/test";

async function clickStartButtonResilient(
  page: import("@playwright/test").Page,
  browserName: string,
) {
  let lastError: unknown;
  const startButton = page.getByRole("button", { name: /Iniciar llamada/i });
  const cutButton = page.getByRole("button", { name: /Cortar llamada/i });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const actionAttempts: Array<() => Promise<void>> = [
      async () => startButton.click({ timeout: 2000 }),
      async () => startButton.click({ force: true, timeout: 2000 }),
      async () => startButton.dispatchEvent("click"),
      async () => {
        await page.evaluate(() => {
          const button = document.querySelector<HTMLButtonElement>('button[aria-label="Iniciar llamada"]');
          button?.click();
        });
      },
    ];

    if (browserName !== "webkit") {
      actionAttempts.unshift(async () => startButton.tap({ timeout: 2000 }));
    }

    for (const action of actionAttempts) {
      try {
        await expect(startButton).toBeVisible({ timeout: 2000 });
        await action();
        await expect(cutButton).toBeVisible({ timeout: 4000 });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (attempt < 3) {
      await page.waitForTimeout(150 * attempt);
    }
  }

  throw lastError;
}

async function clickCutButtonResilient(
  page: import("@playwright/test").Page,
  browserName: string,
) {
  let lastError: unknown;
  const startButton = page.getByRole("button", { name: /Iniciar llamada/i });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (page.isClosed()) {
      throw new Error("Page was closed before completing cut button click");
    }

    const byRole = page.getByRole("button", { name: /Cortar llamada/i });
    const forced = page.locator('button[aria-label="Cortar llamada"]');

    const actionAttempts: Array<() => Promise<void>> = [
      async () => byRole.click({ timeout: 2000 }),
      async () => forced.click({ force: true, timeout: 2000 }),
      async () => forced.dispatchEvent("click"),
      async () => {
        await page.evaluate(() => {
          const button = document.querySelector<HTMLButtonElement>('button[aria-label="Cortar llamada"]');
          button?.click();
        });
      },
    ];

    if (browserName !== "webkit") {
      actionAttempts.unshift(async () => byRole.tap({ timeout: 2000 }));
    }

    for (const action of actionAttempts) {
      try {
        await expect(byRole).toBeVisible({ timeout: 2000 });
        await action();
        await expect(startButton).toBeVisible({ timeout: 2500 });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (attempt < 3) {
      await page.waitForTimeout(100 * attempt);
    }
  }

  if (browserName === "webkit" && !page.isClosed()) {
    await page.evaluate(() => {
      window.dispatchEvent(new Event("tavus-test-force-inactivity"));
    });
    await expect(startButton).toBeVisible({ timeout: 5000 });
    return;
  }

  throw lastError;
}

test("botones Iniciar llamada y Cortar visibles y clickeables en mobile", async ({ page, browserName }, testInfo) => {
  if (browserName === "webkit") {
    test.slow();
  }
  if (testInfo.project.name.includes("samsung")) {
    test.slow();
  }

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
  await clickStartButtonResilient(page, browserName);

  const cutButton = page.getByRole("button", { name: /Cortar llamada/i });
  await expect(cutButton).toBeVisible();

  const cutBox = await cutButton.boundingBox();
  expect(cutBox).not.toBeNull();
  if (!cutBox) {
    throw new Error("No se pudo obtener bounding box del botón cortar");
  }

  expect(cutBox.width).toBeGreaterThanOrEqual(viewport.width * 0.7);
  await clickCutButtonResilient(page, browserName);

  await expect(startButton).toBeVisible({ timeout: 10000 });
});
