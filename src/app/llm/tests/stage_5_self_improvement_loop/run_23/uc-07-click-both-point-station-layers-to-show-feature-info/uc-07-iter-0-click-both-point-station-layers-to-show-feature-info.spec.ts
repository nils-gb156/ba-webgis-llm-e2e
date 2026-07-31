// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: both station layers are rendered
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Ensure no measurement tool is active
    const measurementToggle = page.getByTestId('measurement-toggle');
    if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
        await measurementToggle.click({ force: true });
    }

    // Ensure the info panel is visible (it should be by default)
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const infoPanel = page.getByTestId('info-panel');
    if (await infoPanel.isVisible()) {
        // Info panel is already open; nothing to do
    } else {
        await infoPanelToggle.click({ force: true });
        await expect(infoPanel).toBeVisible();
    }

    // Click on the map at the specified coordinates
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: {
            x: 1188692.84,
            y: 6767643.28,
        },
    });

    // Wait for the info panel to load feature info for both layers
    await expect(page.getByRole('heading', { name: 'UV-Index Station', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 })).toBeVisible();
});
