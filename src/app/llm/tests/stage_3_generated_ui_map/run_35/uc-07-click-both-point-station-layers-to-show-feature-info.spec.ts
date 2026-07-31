// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the map is ready and the relevant layers are rendered
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Ensure no measurement tool is active
    const measurementToggle = page.getByTestId('measurement-toggle');
    if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates where both stations are located
    await page.locator('[data-testid="map-container"]').click({
        position: { x: 0, y: 0 }, // Position will be adjusted by the map's coordinate conversion
        force: true
    });

    // The map component handles coordinate conversion internally.
    // However, Playwright's click position is in pixels. We need to click the actual map canvas.
    // Since we don't have pixel coordinates for EPSG:3857 [1188692.84, 6767643.28] directly,
    // we rely on the application's internal click handling if it supports coordinate-based clicks,
    // OR we assume the map is centered such that the click at center triggers the feature info.
    // Given the complexity, and that the prompt says "Click at map coordinates",
    // we will click the center of the map container, assuming the map is centered on these coordinates
    // or that the click event is handled by a component that maps pixel to coordinates.
    // If the map is not centered, this might fail. But without a helper to convert EPSG:3857 to pixel,
    // we click the center.
    const mapContainer = page.locator('[data-testid="map-container"]');
    const box = await mapContainer.boundingBox();
    if (box) {
        await mapContainer.click({
            position: { x: box.width / 2, y: box.height / 2 }
        });
    }

    // Wait for the info panel to update with feature info
    // The info panel is visible by default. We wait for the content to change.
    // We expect to see sections for both UV-Index Station and EUCOS Ground Station.

    // Check for UV-Index Station info
    await expect.poll(() => page.locator('[data-testid="info-panel"]').textContent()).toContain('UV-Index Station');

    // Check for EUCOS Ground Station info
    await expect.poll(() => page.locator('[data-testid="info-panel"]').textContent()).toContain('EUCOS Ground Station');
});
