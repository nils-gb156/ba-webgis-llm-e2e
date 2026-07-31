// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from "@playwright/test";
import { isLayerRendered } from "../../../../map-model-helpers";

test("Use Case 7: Click both point station layers to show feature info", async ({ page }) => {
  await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

  // Preconditions: Info panel is visible (it is open by default).
  await expect(page.getByTestId("info-panel")).toBeVisible();

  // Preconditions: Both station layers are active.
  // Wait for them to be rendered on the map.
  await expect.poll(() => isLayerRendered(page, "UV-Index Stations")).toBe(true);
  await expect.poll(() => isLayerRendered(page, "EUCOS Ground Stations")).toBe(true);

  // Step 1: Click at the specified map coordinates.
  await page.getByTestId("map-container").click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Step 2: Wait for the info panel to load feature info for both layers.
  await expect.poll(() =>
    page.getByRole("heading", { name: "UV-Index Station" }).isVisible()
  ).toBe(true);

  await expect.poll(() =>
    page.getByRole("heading", { name: "EUCOS Ground Station" }).isVisible()
  ).toBe(true);
});
