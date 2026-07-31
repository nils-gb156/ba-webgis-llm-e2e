// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from "../../../map-model-helpers";

test("Use Case 7: Click both point station layers to show feature info", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Ensure map is ready and layers are rendered
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, "UV-Index Stations")).toBe(true);
    await expect.poll(() => isLayerRendered(page, "EUCOS Ground Stations")).toBe(true);

    // Ensure info panel is visible (it is visible by default, but wait for stability)
    await expect(page.getByTestId("info-panel")).toBeVisible();

    // Ensure measurement tool is not active
    const measurementToggle = page.getByTestId("measurement-toggle");
    const isMeasurementActive = await measurementToggle.getAttribute("aria-pressed");
    if (isMeasurementActive === "true") {
        await measurementToggle.click({ force: true });
    }

    // Click on the map at the specific coordinates where both stations are located
    const mapContainer = page.getByTestId("map-container");
    await mapContainer.click({
        position: { x: 400, y: 300 }
    });

    // Wait for the info panel to update with feature info
    // The click triggers a GetFeatureInfo request. We wait for the info panel content to change.
    // We look for the specific section headers in the info panel.
    await expect.poll(async () => {
        const infoPanel = page.getByTestId("info-panel");
        const uviSection = infoPanel.getByText("UV-Index Station", { exact: false });
        const eucosSection = infoPanel.getByText("EUCOS Ground Station", { exact: false });
        const hasUvi = await uviSection.isVisible();
        const hasEucos = await eucosSection.isVisible();
        return { hasUvi, hasEucos };
    }).toEqual({ hasUvi: true, hasEucos: true });

    // Assert that the info panel displays the 'UV-Index Station' section
    await expect(page.getByTestId("info-panel").getByText("UV-Index Station")).toBeVisible();

    // Assert that the info panel displays the 'EUCOS Ground Station' section
    await expect(page.getByTestId("info-panel").getByText("EUCOS Ground Station")).toBeVisible();
});
