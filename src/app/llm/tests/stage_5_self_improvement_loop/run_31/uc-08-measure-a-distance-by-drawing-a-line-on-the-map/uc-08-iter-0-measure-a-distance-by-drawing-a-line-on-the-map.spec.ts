// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    // 1. Click the 'Measurement' button in the toolbar
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    await measurementToggle.click();

    // 2. Click several points on the map canvas to draw a line
    const mapContainer = page.getByTestId('map-container');

    // Get the current map center to click relative to it
    const center = await getMapCenter(page);
    expect(center).toBeDefined();
    const [cx, cy] = center!;

    // Define click points relative to the map center to draw a line
    // Point 1: slightly left and up from center
    await mapContainer.click({ position: { x: cx - 100, y: cy - 100 } });
    // Point 2: slightly right and down from center
    await mapContainer.click({ position: { x: cx + 100, y: cy + 100 } });
    // Point 3: further right and up
    await mapContainer.click({ position: { x: cx + 200, y: cy - 150 } });

    // 3. Double-click to finish the measurement
    await mapContainer.dblclick({ position: { x: cx + 200, y: cy - 150 } });

    // Expected results:
    // - The measurement panel is visible.
    // - The measurement panel displays a length value with a unit.

    // The measurement panel should be visible (it's part of the info panel or a dedicated panel)
    // Based on the UI, the info panel is already open. The measurement result usually appears in the info panel or a dedicated measurement panel.
    // Let's check the info panel for the measurement result.
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // Wait for the measurement result to appear in the info panel.
    // It typically contains a length value and a unit (e.g., "1.23 km").
    // We'll poll for any text that looks like a measurement result in the info panel.
    await expect.poll(async () => {
        const infoPanelText = await infoPanel.textContent();
        // Look for a pattern like "Length: X km" or "Distance: X m" or just a number with a unit
        return infoPanelText?.match(/\d+(\.\d+)?\s*(km|m|mi|ft)/i);
    }).toBeTruthy();
});
