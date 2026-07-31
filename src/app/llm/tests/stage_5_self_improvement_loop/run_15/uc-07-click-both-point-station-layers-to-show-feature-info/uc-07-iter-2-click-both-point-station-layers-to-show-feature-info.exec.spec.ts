// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition checks
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

    // Ensure no measurement tool is active
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementActive === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates
    // The map container itself intercepts pointer events; use force: true to click the
    // underlying canvas element directly.
    await page.getByTestId('map-container').click({
        force: true,
        position: { x: 1188692.84, y: 6767643.28 }
    });

    // Wait for the info panel to load the station info for both layers
    await expect(page.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
