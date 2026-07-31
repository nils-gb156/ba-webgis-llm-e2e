// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const infoPanel = page.getByTestId('info-panel');

    // If the info panel is not currently visible (pressed state), open it
    const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (isInfoPanelPressed === 'false') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    // Ensure no measurement tool is active
    const measurementToggle = page.getByTestId('measurement-toggle');
    const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementPressed === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates to trigger feature info
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 1188692.84, y: 6767643.28 },
    });

    // Wait for the info panel to load the station info for both layers
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Verify that the info panel displays a 'UV-Index Station' section with feature information
    await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();

    // Verify that the info panel displays an 'EUCOS Ground Station' section with feature information
    await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
