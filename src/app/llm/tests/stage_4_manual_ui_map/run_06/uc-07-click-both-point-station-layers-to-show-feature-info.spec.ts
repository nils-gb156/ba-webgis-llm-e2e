// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: required layers are active and rendered
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Verify info panel is visible by default
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Step 1: Click on the map at the specific coordinates where both stations overlap
    const clickX = 1188692.84;
    const clickY = 6767643.28;
    await page.locator('#map-container').click({
        position: {
            x: clickX,
            y: clickY,
        },
    });

    // Step 2: Wait for the info panel to load station info for both layers
    await expect(page.getByTestId('uvi-station-info')).toBeVisible();
    await expect(page.getByTestId('eucos-station-info')).toBeVisible();
});
