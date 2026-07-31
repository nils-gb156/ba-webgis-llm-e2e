// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getHighlightedCoordinate } from "../../../../map-model-helpers";

test("Use Case 6: Click a map position to show the weather forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Ensure the info panel is visible (it should be by default, but assert to be safe)
    await expect(page.getByTestId("info-panel")).toBeVisible();

    // Click on the map canvas at a specific position to trigger the forecast
    // Using a position that is clearly on land and away from the edges to avoid
    // any potential map boundary issues.
    const mapContainer = page.getByTestId("map-container");
    await mapContainer.click({ position: { x: 500, y: 400 } });

    // Wait for the forecast to load and display
    await expect(page.getByTestId("weather-forecast-section")).toBeVisible();

    // Check that the clicked position is highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Check that the info panel displays a weather forecast section
    await expect(page.getByTestId("weather-forecast-section")).toContainText("Weather Forecast");

    // Check that the forecast contains 24 entries
    const forecastSection = page.getByTestId("weather-forecast-section");
    const forecastEntries = forecastSection.locator(".forecast-entry");
    await expect(forecastEntries).toHaveCount(24);
});
