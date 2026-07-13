// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getMapCenter, isLayerRendered } from "../../llm/map-model-helpers";

const TEMPERATURE_LAYER_TITLE = "Temperature";
const PRECIPITATION_LAYER_TITLE = "Precipitation";
const SEARCH_TERM = "Münster";

// Münster, Germany in EPSG:3857 (approx). Used to verify the map navigated to
// the searched location (a loose bounding box tolerates geocoder precision).
const MUENSTER_3857 = { x: 849000, y: 6793000 };
const NAV_TOLERANCE = 50000;

test("UC-10: configure layers, search for a location and load the forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Wait for the app to fully initialize (tiles, services, etc.).
    await page.waitForLoadState("networkidle");

    const map = page.getByTestId("map-container");
    const layerSwitcher = page.getByTestId("layer-switcher");
    const infoPanel = page.getByTestId("info-panel");
    const geocoderInput = page.getByTestId("geocoder-input");
    const geocoderResults = page.getByTestId("geocoder-results");
    const firstResult = page.getByTestId("geocoder-result-item-0");
    const forecastWidget = page.getByTestId("weather-forecast");
    const forecastEntries = page.getByTestId("weather-forecast-entry");

    // The TOC renders each layer with a checkbox whose accessible name is the
    // layer title; clicking the label avoids the visually-covered input.
    const temperatureToggle = layerSwitcher.getByRole("checkbox", {
        name: TEMPERATURE_LAYER_TITLE,
        exact: true
    });
    const temperatureLabel = layerSwitcher.getByText(TEMPERATURE_LAYER_TITLE, { exact: true });
    const precipitationToggle = layerSwitcher.getByRole("checkbox", {
        name: PRECIPITATION_LAYER_TITLE,
        exact: true
    });
    const precipitationLabel = layerSwitcher.getByText(PRECIPITATION_LAYER_TITLE, { exact: true });

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition: the layer switcher, info panel and geocoder are accessible.
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();

    // Precondition: Temperature is initially visible, Precipitation initially hidden.
    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();
    expect(await isLayerRendered(page, TEMPERATURE_LAYER_TITLE)).toBe(true);
    expect(await isLayerRendered(page, PRECIPITATION_LAYER_TITLE)).toBe(false);

    // Step 1: hide the Temperature overlay.
    await temperatureLabel.click();

    // Step 2: show the Precipitation overlay.
    await precipitationLabel.click();

    // Expected result: Temperature toggle is now off, Precipitation toggle is on.
    // Note: the use case wording is inverted vs. the steps; we assert the state
    // that actually results from the steps (Temperature hidden, Precipitation shown).
    await expect(temperatureToggle).not.toBeChecked();
    await expect(precipitationToggle).toBeChecked();
    // Map-model level: layer rendering reflects the new visibility.
    await expect.poll(() => isLayerRendered(page, TEMPERATURE_LAYER_TITLE)).toBe(false);
    await expect.poll(() => isLayerRendered(page, PRECIPITATION_LAYER_TITLE)).toBe(true);

    // Remember the map center before the search to verify navigation afterwards.
    const centerBefore = await getMapCenter(page);

    // Step 3: click the search field and type a place name.
    await geocoderInput.click();
    await geocoderInput.fill(SEARCH_TERM);

    // Step 4: wait for the result list to appear and select the first result.
    await expect(geocoderResults).toBeVisible({ timeout: 15000 });
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: wait for the map to navigate to the selected location.
    // Map-model level: the center moves close to Münster's coordinates.
    await expect
        .poll(
            async () => {
                const center = await getMapCenter(page);
                if (!center) return false;
                return (
                    Math.abs(center[0] - MUENSTER_3857.x) < NAV_TOLERANCE &&
                    Math.abs(center[1] - MUENSTER_3857.y) < NAV_TOLERANCE
                );
            },
            { timeout: 10000 }
        )
        .toBe(true);

    // Sanity: the center actually changed from its initial position.
    const centerAfter = await getMapCenter(page);
    expect(centerAfter).toBeDefined();
    if (centerBefore && centerAfter) {
        expect(centerAfter[0] !== centerBefore[0] || centerAfter[1] !== centerBefore[1]).toBe(true);
    }

    // Step 6: wait for the info panel to load the forecast.

    // Expected result: the info panel displays a weather forecast section with
    // 24 entries.
    await expect(forecastWidget).toBeVisible({ timeout: 15000 });
    await expect(forecastEntries).toHaveCount(24);
});
