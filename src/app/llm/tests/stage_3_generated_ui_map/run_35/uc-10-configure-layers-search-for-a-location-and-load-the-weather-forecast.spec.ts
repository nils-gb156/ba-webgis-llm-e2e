// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { isLayerRendered } from "../../../map-model-helpers";

test("Use Case 10: Configure layers, search for a location and load the weather forecast", async ({
  page,
}) => {
  await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByRole("checkbox", { name: "Temperature" });
  await temperatureToggle.click();

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByRole("checkbox", { name: "Precipitation" });
  await precipitationToggle.click();

  // Step 3: Search for a location
  const geocoderInput = page.getByTestId("geocoder-input");
  await geocoderInput.fill("Münster");

  // Step 4: Wait for results and select the first one
  const firstResult = page.getByTestId("geocoder-result-item-0");
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation to complete
  // We poll the map center to ensure it has changed from the initial view.
  const initialCenter = await page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    return map?.olMap.getView().getCenter();
  });
  await expect.poll(() => {
    return page.evaluate(() => {
      const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
      return map?.olMap.getView().getCenter();
    });
  }).not.toEqual(initialCenter);

  // Step 6: Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId("weather-forecast-section");
  await expect(weatherForecastSection).toBeVisible();

  // Expected results verification

  // The Precipitation overlay layer toggle is in the disabled state (checked/active means visible)
  // Since we turned it ON, it should be checked. The prompt says "disabled state" which usually means
  // visually disabled or just the state of the toggle itself. Given the context of "showing" it,
  // it should be checked. Let's verify it is rendered on the map.
  await expect.poll(() => isLayerRendered(page, "Precipitation")).toBe(true);

  // The Temperature overlay layer toggle is in the enabled state (unchecked/hidden)
  // Since we turned it OFF, it should be unchecked. Let's verify it is NOT rendered on the map.
  await expect.poll(() => isLayerRendered(page, "Temperature")).toBe(false);

  // The info panel displays a weather forecast section with 24 entries.
  const weatherEntries = page.getByTestId("weather-forecast-entry");
  await expect(weatherEntries).toHaveCount(24);
});
