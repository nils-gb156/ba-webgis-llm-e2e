// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible.
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Step 1: Click at the specified map coordinates.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 1188692.84, y: 6767643.28 } });

    // Step 2: Wait for the info panel to load the station info for both layers.
    await expect(page.getByText('UV-Index Station')).toBeVisible();
    await expect(page.getByText('EUCOS Ground Station')).toBeVisible();
});
