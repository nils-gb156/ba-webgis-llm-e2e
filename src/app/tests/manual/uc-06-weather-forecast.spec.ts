// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getHighlightedCoordinate } from "../../llm/map-model-helpers";

test("UC-6: click a map position to show the weather forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    const map = page.getByTestId("map-container");
    const infoPanel = page.getByTestId("info-panel");
    const forecastSection = page.getByTestId("weather-forecast-section");
    const forecastWidget = page.getByTestId("weather-forecast");
    const forecastEntries = page.getByTestId("weather-forecast-entry");

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition: the info panel is visible and no forecast is loaded yet.
    await expect(infoPanel).toBeVisible();
    await expect(forecastSection).toBeVisible();
    await expect(forecastWidget).not.toBeVisible();

    // Precondition: no map highlight exists before clicking.
    expect(await getHighlightedCoordinate(page)).toBeUndefined();

    // Step 1: click on a position on the map canvas (center of the map container).
    const mapBounds = await map.boundingBox();
    const clickX = (mapBounds?.x ?? 0) + (mapBounds?.width ?? 0) / 2;
    const clickY = (mapBounds?.y ?? 0) + (mapBounds?.height ?? 0) / 2;
    await page.mouse.click(clickX, clickY);

    // Expected result: the clicked position is highlighted on the map. The
    // highlight is read from the exposed map model since the canvas is not
    // observable through the DOM.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Step 2: wait for the info panel to load the forecast.

    // Expected result: the info panel displays a weather forecast section.
    await expect(forecastWidget).toBeVisible({ timeout: 15000 });

    // Expected result: the forecast contains 24 entries.
    await expect(forecastEntries).toHaveCount(24);
});
