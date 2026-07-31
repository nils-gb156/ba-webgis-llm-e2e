// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure measurement tool is not active.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const measurementIsPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementIsPressed === 'true') {
        await measurementToggle.click({ force: true });
    }

    // Click on the map at the specified coordinates.
    // Use force: true to bypass pointer event interception by sibling elements.
    await page.getByTestId('map-container').click({
        position: { x: 1188692.84, y: 6767643.28 },
        force: true,
    });

    // Wait for the info panel to load feature information for both station layers.
    await expect.poll(() => page.getByRole('heading', { name: 'UV-Index Station' }).isVisible()).toBeTruthy();
    await expect.poll(() => page.getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()).toBeTruthy();
});
