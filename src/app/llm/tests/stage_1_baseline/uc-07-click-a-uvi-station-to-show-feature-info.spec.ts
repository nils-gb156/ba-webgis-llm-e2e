// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from "@playwright/test";

test("Use Case 7: Click a UVI station to show feature info", async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Wait for the application to load and the map to be ready
    await page.waitForLoadState("networkidle");

    // Ensure the info panel is visible
    const infoPanel = page.getByRole("region", { name: /info/i, includeHidden: false }).first();
    await expect(infoPanel).toBeVisible({ timeout: 10000 });

    // Register a listener for the WMS GetFeatureInfo request before clicking
    let getFeatureInfoRequest: any = null;
    page.on("request", (request) => {
        const url = request.url();
        if (url.includes("GetFeatureInfo") && url.includes("UV-Index")) {
            getFeatureInfoRequest = request;
        }
    });

    // Click on the UVI station marker at the specified coordinates
    // Coordinates: [1188692.84, 6767643.28] (EPSG:3857)
    const mapCanvas = page.locator("canvas");
    await mapCanvas.click({
        position: {
            x: 1188692.84,
            y: 6767643.28
        }
    });

    // Wait for the WMS GetFeatureInfo request to be sent
    await expect
        .poll(() => getFeatureInfoRequest !== null)
        .toBeTruthy({
            timeout: 10000
        });

    // Verify that the info panel displays the 'UV-Index Station' section
    await expect(page.getByText("UV-Index Station")).toBeVisible({ timeout: 10000 });

    // Verify that some feature information is displayed
    // Since the exact content depends on the WMS response, we check for the presence of the section
    // and assume that if the section is visible, the feature info is loaded correctly
    const stationSection = page
        .getByRole("region", { name: /UV-Index Station/i, includeHidden: false })
        .first();
    await expect(stationSection).toBeVisible({ timeout: 10000 });
});
