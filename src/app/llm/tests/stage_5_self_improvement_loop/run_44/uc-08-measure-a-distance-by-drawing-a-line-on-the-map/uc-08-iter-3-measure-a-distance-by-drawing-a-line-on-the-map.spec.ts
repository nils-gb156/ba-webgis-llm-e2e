// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready
    await expect.poll(() => getMapCenter(page)).toBeDefined();

    // 1. Activate the measurement tool
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click({ force: true });

    // Wait for the measurement panel/dialog to appear
    const measurementPanel = page.getByTestId('measurement-panel');
    await expect(measurementPanel).toBeVisible();

    // 2. Click several points on the map canvas to draw a line.
    // Use the map container for clicking, as the map is a canvas.
    const mapContainer = page.getByTestId('map-container');

    // Click point 1
    await mapContainer.click({
        position: { x: 400, y: 300 },
        clickCount: 1,
    });

    // Click point 2 (offset from point 1)
    await mapContainer.click({
        position: { x: 500, y: 400 },
        clickCount: 1,
    });

    // Click point 3 (offset further)
    await mapContainer.click({
        position: { x: 600, y: 350 },
        clickCount: 1,
    });

    // 3. Double-click to finish the measurement
    await mapContainer.click({
        position: { x: 600, y: 350 },
        clickCount: 2,
    });

    // Wait for the measurement result to appear in the info panel
    // The info panel should contain text like "Length: X km" or similar
    const infoPanel = page.getByTestId('info-panel');
    await expect.poll(async () => {
        const panelText = await infoPanel.textContent();
        return panelText;
    }).toMatch(/length/i);

    // Verify the measurement panel displays a length value with a unit
    const panelText = await infoPanel.textContent();
    expect(panelText).toMatch(/(\d+(\.\d+)?)\s*(km|m|mi|ft)/i);
});
