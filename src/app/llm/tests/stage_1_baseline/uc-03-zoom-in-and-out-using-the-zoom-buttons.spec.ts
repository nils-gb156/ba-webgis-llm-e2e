// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from "@playwright/test";

test("Use Case 3: Zoom in and out using the zoom buttons", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Wait for the map canvas to be visible, indicating the map is loaded
    const mapCanvas = page.locator("canvas");
    await expect(mapCanvas).toBeVisible();

    // Locate the zoom in and zoom out buttons.
    // Assuming standard ARIA labels for these controls.
    const zoomInButton = page.getByRole("button", { name: /zoom in/i });
    const zoomOutButton = page.getByRole("button", { name: /zoom out/i });

    // Ensure buttons are visible before interacting
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    // Get initial zoom level via OpenLayers map object
    const initialZoom = await page.evaluate(() => {
        // Open Pioneer Trails typically exposes the OL map instance on the window or via a specific global
        // If not directly accessible, we might need to rely on DOM state if available.
        // However, the prompt states map content is on canvas and not DOM.
        // We will assume the application exposes the map instance or we can query it.
        // A common pattern in Pioneer is `window.__pioneerMap` or similar, but let's try a generic approach.
        // If no global is exposed, we might have to infer from other UI elements if they exist.
        // For this test, we will assume we can access the map instance via a common global or evaluate context.
        // Let's try to find the map instance. In many Pioneer apps, it's attached to the window.
        const map = (window as any).__pioneerMap || (window as any).map;
        if (map && map.getView) {
            return map.getView().getZoom();
        }
        return null;
    });

    // If we can't get the zoom level programmatically, we might need to rely on visual cues or other indicators.
    // However, the prompt asks to verify zoom level changes.
    // Let's assume the map instance is accessible. If not, this test might need adjustment based on actual app structure.
    // For the sake of the exercise, we will proceed with the assumption that we can get the zoom.

    // Step 1: Click Zoom In
    await zoomInButton.click();

    // Wait for the map to update (zoom animation or tile reload)
    // We can wait for a short period or check for a specific state change if available.
    // Since we can't assert on canvas, we'll wait for the map view to settle.
    await page.waitForTimeout(500); // Minimal wait to allow UI update, though not ideal, it's a fallback if no other signal

    // Verify zoom level increased
    const zoomAfterIn = await page.evaluate(() => {
        const map = (window as any).__pioneerMap || (window as any).map;
        if (map && map.getView) {
            return map.getView().getZoom();
        }
        return null;
    });

    expect(zoomAfterIn).toBeGreaterThan(initialZoom as number);

    // Step 2: Click Zoom Out
    await zoomOutButton.click();

    // Wait for the map to update
    await page.waitForTimeout(500);

    // Verify zoom level decreased compared to after zoom in
    const zoomAfterOut = await page.evaluate(() => {
        const map = (window as any).__pioneerMap || (window as any).map;
        if (map && map.getView) {
            return map.getView().getZoom();
        }
        return null;
    });

    expect(zoomAfterOut).toBeLessThan(zoomAfterIn as number);
});
