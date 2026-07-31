// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from "../../../../map-model-helpers";

test("Use Case 6: Click a map position to show the weather forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Ensure the info panel is visible and the map is ready
    await expect(page.getByTestId("info-panel")).toBeVisible();
    await expect(page.getByTestId("map-container")).toBeVisible();

    // Click on a position on the map canvas
    // Use a center-ish position to ensure we are on land and likely to get a forecast
    await page.getByTestId("map-container").click({ position: { x: 600, y: 300 } });

    // Wait for the info panel to load the forecast
    // The forecast section should appear
    await expect(page.getByTestId("weather-forecast-section")).toBeVisible();

    // Assert the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Assert the forecast contains 24 entries
    // The forecast entries are rendered as elements with data-testid="weather-forecast-entry"
    const forecastEntries = page.getByTestId("weather-forecast-entry");
    await expect(forecastEntries).toHaveCount(24);
});
