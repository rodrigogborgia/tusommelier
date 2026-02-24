import { test, expect } from "@playwright/test";

test("layout resultante: header + avatar centrado + controles inferiores", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const avatarPlaceholder = page.getByText("📹 Video del Avatar");
  const callButton = page.getByRole("button", { name: /Iniciar llamada/i });

  await expect(avatarPlaceholder).toBeVisible();
  await expect(callButton).toBeVisible();

  const avatarBox = await avatarPlaceholder.boundingBox();
  const controlsBox = await callButton.boundingBox();

  expect(avatarBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();

  if (!avatarBox || !controlsBox) {
    throw new Error("No se pudieron calcular posiciones del layout");
  }

  expect(controlsBox.y).toBeGreaterThan(avatarBox.y + avatarBox.height * 0.6);

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  if (!viewport) {
    throw new Error("No se pudo obtener viewport");
  }

  const avatarCenterX = avatarBox.x + avatarBox.width / 2;
  const viewportCenterX = viewport.width / 2;

  expect(Math.abs(avatarCenterX - viewportCenterX)).toBeLessThan(150);
});
