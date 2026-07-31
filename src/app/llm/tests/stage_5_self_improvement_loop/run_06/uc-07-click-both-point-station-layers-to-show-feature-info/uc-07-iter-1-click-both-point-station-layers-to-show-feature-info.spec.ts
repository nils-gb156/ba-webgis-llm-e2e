// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and the required layers to be rendered
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Ensure the info panel is open
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // Ensure no measurement tool is active
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }

    // Wait for the map to be ready (zoom level is defined)
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Click on the map at the specified coordinates
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 400, y: 300 },
    });

    // Wait for the info panel to load the station info for both layers
    // Poll for the highlight marker to appear at the clicked coordinates
    await expect.poll(() => getHighlightedCoordinate(page)).toEqual([1188692.84, 6767643.28]);

    // Verify that the info panel displays a 'UV-Index Station' section
    await expect(infoPanel.getByText('UV-Index Station')).toBeVisible();

    // Verify that the info panel displays an 'EUCOS Ground Station' section
    await expect(infoPanel.getByText('EUCOS Ground Station')).toBeVisible();
});
