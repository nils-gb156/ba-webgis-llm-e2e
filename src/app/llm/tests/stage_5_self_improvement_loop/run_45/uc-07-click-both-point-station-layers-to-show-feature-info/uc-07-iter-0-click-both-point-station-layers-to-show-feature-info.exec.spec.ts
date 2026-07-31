// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: info panel is visible, both layers are active
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

    // Ensure measurement tool is not active
    const measurementToggle = page.getByTestId('measurement-toggle');
    const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementActive === 'true') {
        await measurementToggle.click();
    }

    // Wait for the map to be fully ready before interacting
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    // Step 1: Click at the specified map coordinates
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 1188692.84, y: 6767643.28 }
    });

    // Step 2: Wait for the info panel to load feature info for both layers
    await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('UV-Index Station');
    await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('EUCOS Ground Station');
});
