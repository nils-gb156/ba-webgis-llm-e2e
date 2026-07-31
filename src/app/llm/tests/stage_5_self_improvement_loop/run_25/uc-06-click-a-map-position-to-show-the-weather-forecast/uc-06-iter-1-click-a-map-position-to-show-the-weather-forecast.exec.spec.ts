// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from "../../../../map-model-helpers";

test("Use Case 6: Click a map position to show the weather forecast", async ({ page }) => {
  await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

  // The info panel is already visible on load.
  await expect(page.getByTestId("info-panel")).toBeVisible();

  // Click the center of the map canvas to trigger a forecast request.
  await page.getByTestId("map-container").click({ position: { x: 500, y: 400 } });

  // Wait for the highlight marker to appear on the map.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the info panel to display the weather forecast section.
  await expect(page.getByTestId("weather-forecast-section")).toBeVisible();

  // The forecast should contain 24 entries.
  // Each entry has a data-testid of "weather-forecast-entry".
  const forecastEntries = page.getByTestId("weather-forecast-entry");
  await expect(forecastEntries).toHaveCount(24);
});
