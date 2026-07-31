// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getHighlightedCoordinate, isLayerRendered } from "../../../../map-model-helpers";

test("Use Case 6: Click a map position to show the weather forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Ensure the info panel is visible.
    const infoPanel = page.getByTestId("info-panel");
    await expect(infoPanel).toBeVisible();

    // Click on the map canvas to trigger the forecast.
    const mapContainer = page.getByTestId("map-container");
    await mapContainer.click({
        position: { x: 400, y: 300 },
    });

    // Wait for the highlighted coordinate to appear on the map.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Wait for the weather forecast section to appear in the info panel.
    const weatherForecastSection = page.getByTestId("weather-forecast-section");
    await expect(weatherForecastSection).toBeVisible();

    // The forecast should contain 24 entries.
    const forecastEntries = weatherForecastSection.getByRole("listitem");
    await expect(forecastEntries).toHaveCount(24);
});
