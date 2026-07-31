// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // 1. Click the 'Measurement' button in the toolbar to open the measurement panel.
    const measurementToggle = page.getByTestId('measurement-toggle');
    await measurementToggle.click({ force: true });

    // Verify the measurement panel is visible.
    // The panel is typically a dialog or a distinct region. Based on the UI, it's likely
    // the "Information" panel or a dedicated overlay. Let's check for a measurement result
    // container or the info panel itself if it's used for results.
    // The prompt mentions "info-panel" and "info-panel-toggle". The measurement result
    // usually appears in a side panel or the info panel. Let's assume the Info Panel
    // is used for measurement results or a dedicated measurement panel appears.
    // Looking at the toolbar, there is an "Info Panel Switcher" button.
    // Let's wait for the measurement panel to be visible. It might be the info panel
    // or a specific measurement widget. Given the complexity, let's look for a
    // measurement result element.
    // The prompt says "measurement panel is visible". Let's try to find a panel
    // that appears. Often this is the "info-panel".
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // 2. The user clicks several points on the map canvas to draw a line.
    // First, get the initial center to click relative to it or use a fixed point.
    // Let's get the current center of the map to click around it.
    const initialCenter = await expect.poll(() => getMapCenter(page)).toBeTruthy();
    const centerX = initialCenter[0];
    const centerY = initialCenter[1];

    // Click a few points to draw a line.
    // Point 1: slightly to the right and down from center
    await page.locator('#map-container').click({
        position: { x: 50, y: 50 },
    });
    // Point 2: further right
    await page.locator('#map-container').click({
        position: { x: 150, y: 50 },
    });
    // Point 3: further right and down
    await page.locator('#map-container').click({
        position: { x: 250, y: 150 },
    });

    // 3. The user double-clicks to finish the measurement.
    await page.locator('#map-container').dblclick({
        position: { x: 300, y: 200 },
    });

    // Expected results:
    // - The measurement panel is visible. (Already asserted above, but let's ensure it's still visible)
    await expect(infoPanel).toBeVisible();

    // - The measurement panel displays a length value with a unit.
    // We need to find the measurement result text. It's likely inside the info panel
    // or a specific measurement result element.
    // Let's look for text that looks like a distance (e.g., "1.23 km", "1234.56 m").
    // We can use expect.poll to wait for the measurement result to appear.
    // The info panel might contain the measurement result.
    const measurementResult = infoPanel.locator('text=/\\d+\\.?\\d*\\s*(km|m|mi|ft)/');
    await expect(measurementResult).toBeVisible();

    // Additionally, we can check if the highlighted coordinate is still present,
    // indicating the measurement line is drawn.
    const highlightedCoord = await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
    expect(highlightedCoord).toBeDefined();
});
