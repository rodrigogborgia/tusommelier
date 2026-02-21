import { test, expect } from "@playwright/test";

test("layout resultante: header + avatar centrado + controles inferiores", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const header = page.getByRole("heading", { name: /Sommelier Digital/i });
  const avatarPlaceholder = page.getByText("📹 Video del Avatar");
  const micButton = page.getByRole("button", { name: "Micrófono" });
  const cameraButton = page.getByRole("button", { name: "Cámara" });
  const callButton = page.getByRole("button", { name: "Iniciar" });

  await expect(header).toBeVisible();
  await expect(avatarPlaceholder).toBeVisible();
  await expect(micButton).toBeVisible();
  await expect(cameraButton).toBeVisible();
  await expect(callButton).toBeVisible();

  const headerBox = await header.boundingBox();
  const avatarBox = await avatarPlaceholder.boundingBox();
  const controlsBox = await micButton.boundingBox();

  expect(headerBox).not.toBeNull();
  expect(avatarBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();

  if (!headerBox || !avatarBox || !controlsBox) {
    throw new Error("No se pudieron calcular posiciones del layout");
  }

  expect(headerBox.y).toBeLessThan(avatarBox.y);
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
