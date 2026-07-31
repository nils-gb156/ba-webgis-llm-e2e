// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Precondition: UV-Index Stations layer is active
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();

    // Precondition: EUCOS Ground Stations layer is active
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

    // Precondition: No measurement tool is active.
    // The "Measurement" button is a toggle (aria-pressed), not a checkbox.
    // Use force: true to click the hidden input, then assert the pressed state.
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementPressed === 'true') {
        await measurementToggle.click({ force: true });
    }
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

    // Precondition: Layers are actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
    // The map container has a canvas child that intercepts pointer events.
    // Use force: true to click through the overlay.
    await page.getByTestId('map-container').click({
        force: true,
        position: { x: 1188692.84, y: 6767643.28 },
    });

    // Step 2: The user waits for the info panel to load the station info for both layers.
    // Expected result: The info panel displays a 'UV-Index Station' section with feature information.
    await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('UV-Index Station');

    // Expected result: The info panel displays an 'EUCOS Ground Station' section with feature information.
    await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('EUCOS Ground Station');
});
