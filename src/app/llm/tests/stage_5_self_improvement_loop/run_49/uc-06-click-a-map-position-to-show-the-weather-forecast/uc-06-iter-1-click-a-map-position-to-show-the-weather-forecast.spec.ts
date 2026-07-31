// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getHighlightedCoordinate } from "../../../../map-model-helpers";

test("Use Case 6: Click a map position to show the weather forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Ensure the info panel is visible (it is visible by default in the initial state)
    const infoPanel = page.getByTestId("info-panel");
    await expect(infoPanel).toBeVisible();

    // Click on the map canvas to trigger the weather forecast request.
    // Use a central position on the map container.
    const mapContainer = page.getByTestId("map-container");
    await mapContainer.click({ position: { x: 400, y: 300 } });

    // Wait for the clicked position to be highlighted on the map.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Wait for the weather forecast section to appear and contain 24 entries.
    const weatherForecastSection = page.getByTestId("weather-forecast-section");
    await expect(weatherForecastSection).toBeVisible();

    // The forecast entries are rendered as list items within the weather forecast section.
    // We poll to wait for the asynchronous loading of the forecast data.
    expect.poll(() => page.evaluate(() => {
        const section = document.querySelector("[data-testid='weather-forecast-section']");
        if (!section) return 0;
        return section.querySelectorAll("li").length;
    })).toBe(24);
});
