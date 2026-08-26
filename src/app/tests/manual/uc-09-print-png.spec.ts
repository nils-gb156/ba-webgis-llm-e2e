// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getActiveBaseLayerTitle, isLayerRendered } from "../../llm/map-model-helpers";

test("UC-9: print the current map view as a PNG", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Wait for the app to fully initialize (tiles, services, etc.).
    await page.waitForLoadState("networkidle");

    const map = page.getByTestId("map-container");
    const printToggle = page.getByTestId("print-toggle");
    const printingPanel = page.getByTestId("printing-panel");

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition (map-model level): at least one base map and one overlay layer
    // are visible on the map.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
    await expect.poll(() => isLayerRendered(page, "Temperature")).toBe(true);

    // Precondition: the print toggle is visible and the printing panel is closed.
    await expect(printToggle).toBeVisible();
    await expect(printingPanel).toHaveCount(0);

    // Step 1: open the printing panel by clicking the toolbar toggle.
    await printToggle.click();

    // Expected result: the printing panel and its content are visible.
    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId("printing")).toBeVisible();

    // Step 2: enter a title for the printout.
    const titleInput = printingPanel.getByPlaceholder("Enter title");
    await titleInput.fill("E2E Test Map");

    // Step 3: select the PNG file format.
    const formatSelect = printingPanel.locator(".printing-select");
    await formatSelect.selectOption("png");
    await expect(formatSelect).toHaveValue("png");

    // Step 4: click the export button and capture the triggered download.
    // The PrintingController renders the map to a canvas and triggers a download
    // via an <a download="<title>.png"> element (see exportMapInPNG).
    const downloadPromise = page.waitForEvent("download");
    await printingPanel.locator(".printing-export-button").click();

    // Expected result: a PNG file containing the current map view is downloaded.
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("E2E Test Map.png");

    // Verify the file was saved to disk (path() returns null if the download failed).
    const path = await download.path();
    expect(path).toBeTruthy();
});
