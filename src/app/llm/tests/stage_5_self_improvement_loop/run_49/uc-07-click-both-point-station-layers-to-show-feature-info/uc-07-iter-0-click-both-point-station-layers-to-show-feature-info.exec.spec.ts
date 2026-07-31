// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC07: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: both station layers are rendered
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Ensure measurement tool is inactive (click the toggle if active)
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
        await measurementToggle.click();
    }

    // Click the map at the specified coordinates
    await page.locator('#map-container').click({
        position: { x: 1188692.84, y: 6767643.28 },
    });

    // Wait for the info panel to show feature information for both layers
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();

    // Verify that both layers are highlighted on the map
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
});
