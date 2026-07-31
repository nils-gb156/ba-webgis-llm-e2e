// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: info panel is visible, both layers are active
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

    // Ensure measurement tool is not active
    const measurementToggle = page.getByTestId('measurement-toggle');
    const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementActive === 'true') {
        await measurementToggle.click();
    }

    // Step 1: Click at the specified map coordinates
    // The map is rendered on a canvas inside the map-container. Use force: true to click through
    // the canvas element (which may intercept pointer events).
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 1188692.84, y: 6767643.28 },
        force: true
    });

    // Step 2: Wait for the info panel to load feature info for both layers
    // Use expect.poll to wait for the async feature info to appear in the panel
    await expect.poll(async () => {
        const infoPanelText = await page.getByTestId('info-panel').textContent();
        return infoPanelText;
    }).toContain('UV-Index Station');

    await expect.poll(async () => {
        const infoPanelText = await page.getByTestId('info-panel').textContent();
        return infoPanelText;
    }).toContain('EUCOS Ground Station');
});
