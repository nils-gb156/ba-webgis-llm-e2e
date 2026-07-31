// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('UC07: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure measurement tool is inactive (click the toggle if active)
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
        await measurementToggle.click();
    }

    // Click the map at the specified coordinates using the test id
    // Use force: true to bypass any overlay intercepting pointer events
    await page.getByTestId('map-container').click({
        position: { x: 1188692.84, y: 6767643.28 },
        force: true,
    });

    // Wait for the info panel to show feature information for both layers
    const infoPanel = page.getByTestId('info-panel');
    await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
