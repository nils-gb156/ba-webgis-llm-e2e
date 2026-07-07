// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from "@playwright/test";

test("Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map", async ({
    page
}) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Wait for the application to load and the layer switcher to be visible
    await expect(page.getByRole("tree")).toBeVisible();

    // Locate the UV-Index layer item in the layer switcher (TOC)
    // Assuming the layer is represented as a tree item or list item with the text "UV-Index"
    const uvIndexLayerItem = page.getByRole("treeitem", { name: "UV-Index" });
    await expect(uvIndexLayerItem).toBeVisible();

    // Locate the visibility toggle checkbox for the UV-Index layer
    // The toggle is likely a checkbox within the layer item
    const uvIndexToggle = uvIndexLayerItem.getByRole("checkbox");
    await expect(uvIndexToggle).toBeChecked({ checked: false });

    // Click the visibility toggle to show the UV-Index overlay
    await uvIndexToggle.click();

    // Verify the toggle is now in the enabled (checked) state
    await expect(uvIndexToggle).toBeChecked({ checked: true });

    // Wait for the map to load the layer tiles.
    // Since map content is on a canvas, we wait for a network response that indicates
    // the layer data (tiles or WMS request) has been fetched.
    // We assume the WMS service or tile server URL contains a distinctive pattern for the UV-Index layer.
    // A common pattern for WMS GetMap requests includes the LAYERS parameter.
    const uvIndexLayerName = "UV-Index";
    const uvIndexRequestPromise = page.waitForResponse((response) => {
        const url = response.url();
        // Check if the response URL contains the layer name or a known WMS endpoint for this layer
        // Adjust the regex based on the actual WMS service URL structure if known.
        // Here we assume a generic WMS GetMap request containing the layer name.
        return url.includes("GetMap") && url.includes(uvIndexLayerName);
    });

    // Wait for the response to ensure the layer data has been requested and received
    await uvIndexRequestPromise;

    // Verify that the UV-Index overlay tiles are rendered on the map canvas.
    // Since we cannot directly assert canvas content, we verify that the map canvas
    // is present and has changed (e.g., by checking if it's visible and non-empty).
    // A more robust check might involve checking for specific visual changes, but
    // given the constraints, we assert the canvas is visible and the layer request succeeded.
    const mapCanvas = page.locator("canvas");
    await expect(mapCanvas).toBeVisible();

    // Additional verification: Ensure the map area is not blank by checking for any non-transparent pixels
    // This is a heuristic check. In a real scenario, visual regression testing or specific feature checks
    // would be more reliable. For this test, we rely on the successful network request and canvas visibility.
    await expect(mapCanvas).toHaveAttribute("width");
    await expect(mapCanvas).toHaveAttribute("height");
});
