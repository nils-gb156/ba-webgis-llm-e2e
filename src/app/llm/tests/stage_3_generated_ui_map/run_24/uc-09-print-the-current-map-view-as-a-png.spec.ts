// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test("Use Case 9: Print the current map view as a PNG", async ({ page }) => {
  await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

  // Verify preconditions: app loaded, base layer active, overlay visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, "Temperature")).toBe(true);

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId("print-toggle");
  // Ensure the printing panel is not already open (toggle state check)
  const printingPanel = page.getByTestId("printing-panel");
  const isPanelVisible = await printingPanel.isVisible();
  if (isPanelVisible) {
    await printToggle.click({ force: true });
    await expect(printingPanel).not.toBeVisible();
  }
  await printToggle.click({ force: true });
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title
  const titleInput = printingPanel.getByLabel(/Title/i);
  if (await titleInput.isVisible()) {
    await titleInput.fill("Test Map Print");
  } else {
    // Fallback if label is ambiguous or different
    const titleField = printingPanel.getByTestId("print-title-input");
    if (await titleField.isVisible()) {
      await titleField.fill("Test Map Print");
    } else {
      // Last resort: find input inside panel
      await printingPanel.locator("input[type='text']").first().fill("Test Map Print");
    }
  }

  // Step 3: Select PNG format
  // Assuming radio buttons or select for format. Let's look for a radio or select.
  const formatRadioPng = printingPanel.getByRole("radio", { name: "PNG", exact: true });
  if (await formatRadioPng.isVisible()) {
    await formatRadioPng.check();
  } else {
    // Fallback to select or other mechanism
    const formatSelect = printingPanel.getByLabel(/Format/i);
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption("png");
    } else {
      // Try clicking a button or option with text "PNG"
      const pngOption = printingPanel.getByText("PNG", { exact: true });
      if (await pngOption.isVisible()) {
        await pngOption.click();
      }
    }
  }

  // Step 4: Trigger export
  // Wait for download event before clicking
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    printingPanel.getByRole("button", { name: /Export|Print|Generate/i }).click()
  ]);

  // Verify download happened
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
