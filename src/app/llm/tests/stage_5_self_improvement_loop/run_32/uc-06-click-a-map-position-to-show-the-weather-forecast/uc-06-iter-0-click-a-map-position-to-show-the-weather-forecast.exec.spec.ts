// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from "../../../../map-model-helpers";

test("Use Case 6: Click a map position to show the weather forecast", async ({ page }) => {
  await page.goto(
    "http://localhost:5173/ba-webgis-llm-e2e/",
  );

  // Ensure the info panel is visible.
  // The info panel toggle button is already pressed (active) in the initial state.
  // We verify it is visible and do not click it.
  await expect(page.getByTestId("info-panel")).toBeVisible();

  // Click a position on the map canvas.
  // We use the map-container data-testid and click near the center of the viewport.
  await page.getByTestId("map-container").click({
    position: { x: 800, y: 400 },
  });

  // Wait for the info panel to load the forecast.
  // We poll the info panel for the weather forecast section heading.
  await expect
    .poll(async () => {
      const infoPanel = page.getByTestId("info-panel");
      const weatherForecastHeading = infoPanel.getByRole("heading", {
        name: "Weather Forecast",
      });
      return weatherForecastHeading.isVisible();
    })
    .toBe(true);

  // The clicked position is highlighted on the map.
  await expect
    .poll(() => getHighlightedCoordinate(page))
    .toBeDefined();

  // The info panel displays a weather forecast section.
  const infoPanel = page.getByTestId("info-panel");
  const weatherForecastSection = infoPanel.getByTestId("weather-forecast-section");
  await expect(weatherForecastSection).toBeVisible();

  // The forecast contains 24 entries.
  // We poll for the number of forecast entries to appear.
  await expect
    .poll(async () => {
      const entries = weatherForecastSection.locator("[data-testid='forecast-entry']");
      const count = await entries.count();
      return count;
    })
    .toBe(24);
});
