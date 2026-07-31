// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from "../../../../map-model-helpers";

test("Use Case 7: Click both point station layers to show feature info", async ({ page }) => {
  await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

  // Preconditions: info panel visible
  await expect(page.getByTestId("info-panel")).toBeVisible();

  // The measurement toggle is a Chakra button, not a checkbox/radio.
  // Check that it is not in the pressed (active) state.
  await expect(page.getByTestId("measurement-toggle")).not.toBeChecked();

  // Step 1: Click on the map at the specified coordinates
  const mapContainer = page.getByTestId("map-container");
  await mapContainer.click({
    position: { x: 100, y: 100 },
  });

  // Wait for the map to process the click and update the highlight
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Step 2: Wait for the info panel to load feature info for both layers
  // Use exact names to avoid ambiguity with other occurrences of "Station"
  await expect.poll(() =>
    page.getByTestId("info-panel").getByRole("heading", { name: "UV-Index Station" }).count()
  ).toBeGreaterThan(0);

  await expect.poll(() =>
    page.getByTestId("info-panel").getByRole("heading", { name: "EUCOS Ground Station" }).count()
  ).toBeGreaterThan(0);

  // Expected results: verify both sections are displayed in the info panel
  const infoPanel = page.getByTestId("info-panel");
  await expect(infoPanel.getByRole("heading", { name: "UV-Index Station" })).toBeVisible();
  await expect(infoPanel.getByRole("heading", { name: "EUCOS Ground Station" })).toBeVisible();
});
