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

    // Step 1: Click at the specified map coordinates on the map canvas.
    // Coordinates are in EPSG:3857 (OpenLayers projection).
    // The canvas element intercepts pointer events, so we click the container with force: true.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 1188692.84, y: 6767643.28 },
        force: true
    });

    // Step 2: Wait for the info panel to load feature info for both layers.
    // The info panel content is rendered asynchronously after the map click triggers GetFeatureInfo requests.
    // We poll the info panel text until both expected layer headings appear.
    await expect.poll(async () => {
        const infoPanel = page.getByTestId('info-panel');
        const text = await infoPanel.textContent();
        return text;
    }).toContain('UV-Index Station');

    await expect.poll(async () => {
        const infoPanel = page.getByTestId('info-panel');
        const text = await infoPanel.textContent();
        return text;
    }).toContain('EUCOS Ground Station');
});
