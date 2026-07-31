// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getHighlightedCoordinate, isLayerRendered } from "../../../../map-model-helpers";

test("Use Case 6: Click a map position to show the weather forecast", async ({ page }) => {
  await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

  // Ensure the info panel is visible and the map is ready
  await expect(page.getByTestId("info-panel")).toBeVisible();
  await expect(page.getByTestId("map-container")).toBeVisible();

  // Click on the map canvas to trigger a forecast fetch
  const mapContainer = page.getByTestId("map-container");
  await mapContainer.click({ position: { x: 600, y: 400 } });

  // Wait for the forecast to load by polling the info panel content
  await expect.poll(() =>
    page.getByTestId("info-panel").getByRole("heading", { name: "Weather Forecast", exact: true }).isVisible()
  ).toBeTruthy();

  // Wait for the weather forecast section to appear with data
  await expect.poll(() =>
    page.getByTestId("info-panel").getByTestId("weather-forecast-section").isVisible()
  ).toBeTruthy();

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Verify the info panel displays a weather forecast section with 24 entries
  // The forecast section contains 24 entries, we can assert by checking the number of items or a specific structure
  const forecastSection = page.getByTestId("weather-forecast-section");
  await expect(forecastSection).toBeVisible();

  // Check that there are 24 entries in the forecast
  // Assuming each entry is a list item or similar, we count them
  const entries = forecastSection.locator("li");
  await expect(entries).toHaveCount(24);
});
