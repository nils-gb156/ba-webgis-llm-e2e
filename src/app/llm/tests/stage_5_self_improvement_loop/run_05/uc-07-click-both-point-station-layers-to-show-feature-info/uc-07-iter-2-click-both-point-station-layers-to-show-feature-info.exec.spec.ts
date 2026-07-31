// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('UC-07: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // --- Preconditions ---

    // Ensure Info Panel is visible.
    // The info-panel-toggle is [pressed] in the initial state, so we do not need to click it.
    // We just wait for the panel to be visible.
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel).toBeVisible();

    // Ensure both station layers are active (checked).
    // The accessibility tree shows both checkboxes are [checked].
    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();

    // --- Steps ---

    // 1. Click at the specified map coordinates [1188692.84, 6767643.28]
    // The map is rendered on a canvas inside the map-container. We click directly on the canvas element.
    const mapCanvas = page.locator('canvas');
    await mapCanvas.click({
        position: { x: 1188692.84, y: 6767643.28 }
    });

    // 2. Wait for the info panel to load the station info for both layers.
    //    The info panel should now display sections for both 'UV-Index Station' and 'EUCOS Ground Station'.
    //    We use expect.poll to wait for the content to appear asynchronously.
    await expect.poll(() => infoPanel.getByText('UV-Index Station').isVisible()).toBe(true);
    await expect.poll(() => infoPanel.getByText('EUCOS Ground Station').isVisible()).toBe(true);

    // --- Expected Results ---

    // The info panel displays a 'UV-Index Station' section with feature information.
    // The info panel displays an 'EUCOS Ground Station' section with feature information.
    // The above expect.poll assertions already confirm the sections are visible.
    await expect(infoPanel.getByText('UV-Index Station')).toBeVisible();
    await expect(infoPanel.getByText('EUCOS Ground Station')).toBeVisible();
});
