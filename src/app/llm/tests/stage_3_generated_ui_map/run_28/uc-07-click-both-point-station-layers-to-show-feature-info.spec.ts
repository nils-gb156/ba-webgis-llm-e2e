// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from "../../../map-model-helpers";

test("Use Case 7: Click both point station layers to show feature info", async ({ page }) => {
  await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

  // Ensure map is ready
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Ensure info panel is visible
  await expect(page.getByTestId("info-panel")).toBeVisible();

  // Ensure both station layers are rendered
  await expect.poll(() => isLayerRendered(page, "UV-Index Stations")).toBe(true);
  await expect.poll(() => isLayerRendered(page, "EUCOS Ground Stations")).toBe(true);

  // Click on the map at the coordinates where both stations are located
  await page.getByTestId("map-container").click({
    position: { x: 500, y: 300 },
  });

  // Wait for the info panel to update with feature info for both layers
  // We poll for the presence of the expected sections in the info panel
  await expect.poll(() => page.getByTestId("info-panel").textContent()).toContain("UV-Index Station");
  await expect.poll(() => page.getByTestId("info-panel").textContent()).toContain("EUCOS Ground Station");

  // Assert that the info panel displays the 'UV-Index Station' section
  await expect(page.getByTestId("info-panel").getByText("UV-Index Station")).toBeVisible();

  // Assert that the info panel displays the 'EUCOS Ground Station' section
  await expect(page.getByTestId("info-panel").getByText("EUCOS Ground Station")).toBeVisible();
});
