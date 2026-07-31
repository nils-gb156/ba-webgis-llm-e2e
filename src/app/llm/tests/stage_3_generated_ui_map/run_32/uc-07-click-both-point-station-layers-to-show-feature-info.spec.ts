// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure map is ready and layers are rendered
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Ensure measurement tool is not active (reset if necessary)
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: {
            x: 1188692.84,
            y: 6767643.28
        }
    });

    // Wait for the info panel to update with feature information
    // The info panel is visible by default, but we need to wait for the content to load
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // Wait for the UV-Index Station section to appear in the info panel
    // We look for a section or heading containing 'UV-Index Station'
    const uvStationSection = page.getByRole('region', { name: /UV-Index Station/i }).first();
    await expect(uvStationSection).toBeVisible();

    // Wait for the EUCOS Ground Station section to appear in the info panel
    // We look for a section or heading containing 'EUCOS Ground Station'
    const eucosStationSection = page.getByRole('region', { name: /EUCOS Ground Station/i }).first();
    await expect(eucosStationSection).toBeVisible();
});
