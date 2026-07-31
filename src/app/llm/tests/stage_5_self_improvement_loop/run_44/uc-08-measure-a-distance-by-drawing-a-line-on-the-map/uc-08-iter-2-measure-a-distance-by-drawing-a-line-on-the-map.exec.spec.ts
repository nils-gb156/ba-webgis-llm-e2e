// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

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

    // 2. Click several points on the map to draw a line
    // Use the map container for clicking, as the map is a canvas.
    const mapContainer = page.getByTestId('map-container');

    // Get the initial center to use as a reference point
    const center = await getMapCenter(page);
    if (!center) {
        throw new Error('Map center not available');
    }

    // Click point 1 (center)
    await mapContainer.click({
        position: { x: 0, y: 0 },
        clickCount: 1,
    });

    // Wait for the first highlight marker to appear
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Click point 2 (offset from center)
    await mapContainer.click({
        position: { x: 100, y: 100 },
        clickCount: 1,
    });

    // Wait for the second highlight marker to appear
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

    // Click point 3 (offset further)
    await mapContainer.click({
        position: { x: 200, y: 50 },
        clickCount: 1,
    });

    // 3. Double-click to finish the measurement
    await mapContainer.click({
        position: { x: 200, y: 50 },
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
