// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getMapZoomLevel } from "../../llm/map-model-helpers";

// Parses the scale denominator from the scale-viewer text (e.g. "1:2,739,072" => 2739072).
// Returns NaN if the text does not match the expected format.
function parseScaleDenominator(text: string | null | undefined): number {
    const match = text?.match(/1:\s*([\d.,\s]+)/);
    if (!match) {
        return NaN;
    }
    return Number((match[1] ?? "").replace(/[.,\s]/g, ""));
}

test("UC-3: zoom in and out using the zoom buttons", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    const map = page.getByTestId("map-container");
    const zoomInButton = page.getByTestId("zoom-in-button");
    const zoomOutButton = page.getByTestId("zoom-out-button");
    const scaleViewer = page.getByTestId("scale-viewer");

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition: the zoom in and zoom out buttons are visible on the map.
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    await expect(scaleViewer).toBeVisible();

    // Capture the initial state on both levels: the map model zoom level and the
    // scale denominator displayed in the scale-viewer (e.g. "1:2,739,072"). A
    // larger denominator means a more zoomed-out map, so zooming in lowers it.
    const initialZoom = await getMapZoomLevel(page);
    expect(initialZoom).toBeDefined();
    const initialScale = parseScaleDenominator(await scaleViewer.textContent());
    expect(initialScale).toBeGreaterThan(0);

    // Step 1: click the 'Zoom in' button to increase the zoom level.
    await zoomInButton.click();

    // Expected result: the map zoom level is higher than before. Verified on the
    // map model (numeric zoom level) and via the scale-viewer (the scale
    // denominator decreases when zooming in).
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom as number);
    const zoomedInZoom = await getMapZoomLevel(page);
    await expect
        .poll(async () => parseScaleDenominator(await scaleViewer.textContent()))
        .toBeLessThan(initialScale);
    const zoomedInScale = parseScaleDenominator(await scaleViewer.textContent());

    // Step 2: click the 'Zoom out' button to decrease the zoom level.
    await zoomOutButton.click();

    // Expected result: the map zoom level is lower than after zooming in. Verified
    // again on both levels: the map model zoom level and the scale-viewer (the
    // scale denominator increases when zooming out).
    await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomedInZoom as number);
    await expect
        .poll(async () => parseScaleDenominator(await scaleViewer.textContent()))
        .toBeGreaterThan(zoomedInScale);
});
