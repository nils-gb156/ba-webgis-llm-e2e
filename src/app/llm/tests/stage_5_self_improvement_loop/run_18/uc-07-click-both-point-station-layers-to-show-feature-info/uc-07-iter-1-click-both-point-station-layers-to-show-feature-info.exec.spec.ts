// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure measurement tool is not active (it may be toggled on by default or from a previous test)
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const measurementIsPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementIsPressed === 'true') {
        await measurementToggle.click();
    }

    // Ensure the info panel is visible.
    // According to the accessibility tree, "Info Panel Switcher" is [pressed] on load,
    // so the panel should already be visible. We assert it to be safe.
    await expect(page.getByRole('heading', { name: 'Information' })).toBeVisible();

    // Click the map at the specified coordinates [1188692.84, 6767643.28].
    // The map-container has a data-testid, so we use getByTestId.
    await page.getByTestId('map-container').click({
        position: { x: 1188692.84, y: 6767643.28 },
    });

    // Wait for the info panel to load the station info for both layers.
    // We use expect.poll to wait for the content to appear.
    await expect.poll(() =>
        page.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible()
    ).toBeTruthy();

    await expect.poll(() =>
        page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible()
    ).toBeTruthy();

    // Verify that a highlight marker appeared on the map at the clicked location.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();
});
