// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure map is ready and initial state is correct
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Ensure info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Ensure no measurement tool is active (reset if necessary, though preconditions say it's not)
    // The preconditions state "No measurement tool is active", so we assume it is already off.
    // We just ensure the map is ready for interaction.

    // Click on the map at the specific coordinates where both stations are located
    // Coordinates are in EPSG:3857: [1188692.84, 6767643.28]
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: {
            x: 1188692.84,
            y: 6767643.28
        }
    });

    // Wait for the info panel to load the station info for both layers
    // We poll for the presence of the specific sections in the info panel
    await expect.poll(() => page.getByTestId('info-panel').locator('text=UV-Index Station').isVisible()).toBe(true);
    await expect.poll(() => page.getByTestId('info-panel').locator('text=EUCOS Ground Station').isVisible()).toBe(true);

    // Verify that the info panel displays the expected sections
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel.locator('text=UV-Index Station')).toBeVisible();
    await expect(infoPanel.locator('text=EUCOS Ground Station')).toBeVisible();
});
