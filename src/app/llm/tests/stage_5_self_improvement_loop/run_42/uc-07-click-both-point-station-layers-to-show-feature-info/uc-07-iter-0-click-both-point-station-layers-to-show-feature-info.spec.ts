// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure measurement tool is off (it is by default, but let's be safe)
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const measurementState = await measurementToggle.getAttribute('aria-pressed');
    if (measurementState === 'true') {
        await measurementToggle.click({ force: true });
    }

    // Click on the map at the specified coordinates
    await page.getByTestId('map-container').click({
        position: { x: 1188692.84, y: 6767643.28 },
    });

    // Wait for the info panel to load feature info for both layers
    await expect.poll(() =>
        page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station' }).isVisible()
    ).toBe(true);

    await expect.poll(() =>
        page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()
    ).toBe(true);
});
