// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial layers to be rendered
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // 1. Click the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // 2. The user clicks several points on the map canvas to draw a line.
    // Click the map container at a few distinct positions to draw a line.
    const mapContainer = page.getByTestId('map-container');

    // Get initial center to calculate click positions
    const center = await page.evaluate(() => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const view = map?.olMap?.getView();
        if (!view) return null;
        const center = view.getCenter();
        if (!center) return null;
        const zoom = view.getZoom();
        const resolution = view.getResolutionForZoom(zoom);
        return { x: center[0], y: center[1], resolution };
    });

    if (center) {
        // Click point 1: slightly top-left from center
        await mapContainer.click({
            position: {
                x: 500,
                y: 300
            }
        });
        // Click point 2: slightly bottom-right from point 1
        await mapContainer.click({
            position: {
                x: 600,
                y: 400
            }
        });
        // Click point 3: further bottom-right
        await mapContainer.click({
            position: {
                x: 700,
                y: 500
            }
        });
    } else {
        // Fallback to absolute positions if map center is not available
        await mapContainer.click({ position: { x: 500, y: 300 } });
        await mapContainer.click({ position: { x: 600, y: 400 } });
        await mapContainer.click({ position: { x: 700, y: 500 } });
    }

    // 3. Double-click to finish the measurement.
    await mapContainer.dblclick({
        position: {
            x: 700,
            y: 500
        }
    });

    // Expected results:
    // - The measurement panel is visible.
    // - The measurement panel displays a length value with a unit.
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // Check for a length value with a unit (e.g., "100 m", "1.5 km")
    // The panel might contain text like "Distance: 123 m" or just "123 m"
    await expect.poll(() => measurementPanel.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
