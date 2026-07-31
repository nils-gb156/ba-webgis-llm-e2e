// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Ensure the info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Step 1: Click on the map at the specified coordinates
    // The map-container testid points to the div wrapping the canvas.
    // Use force: true because the map canvas may intercept pointer events.
    await page.getByTestId('map-container').click({
        position: { x: 1188692.84, y: 6767643.28 },
        force: true,
    });

    // Step 2: Wait for the info panel to load the station info for both layers
    // The info panel should display sections for both UV-Index Station and EUCOS Ground Station
    await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
