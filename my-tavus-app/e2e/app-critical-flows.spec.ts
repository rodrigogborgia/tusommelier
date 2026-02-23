import { test, expect, type Page, type Route } from "@playwright/test";

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

test("flujo crítico: iniciar llamada y cortar vuelve al estado inicial", async ({ page }) => {
  await mockConversationSuccess(page);
  await page.goto("http://localhost:5173");

  const startButton = page.getByRole("button", { name: /Iniciar llamada/i });
  await expect(startButton).toBeVisible();

  await startButton.click();

  const cutButton = page.getByRole("button", { name: /Cortar llamada/i });
  await expect(cutButton).toBeVisible();
  await cutButton.click();

  await expect(startButton).toBeVisible();
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
