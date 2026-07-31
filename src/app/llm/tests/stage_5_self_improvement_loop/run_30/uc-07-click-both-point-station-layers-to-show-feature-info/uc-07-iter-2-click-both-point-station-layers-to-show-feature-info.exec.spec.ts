// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: info panel is visible and layers are rendered
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();

    // Click on the map at the specified coordinates where both station types overlap.
    // The map-container is an HTML element but the actual map canvas intercepts pointer events.
    // Use force: true to click through the overlay.
    const x = 1188692.84;
    const y = 6767643.28;
    await page.getByTestId('map-container').click({ position: { x, y }, force: true });

    // Wait for the feature info to load in the info panel for both station types.
    // Use expect.poll with toBeVisible matcher (which auto-retries) instead of
    // polling the return value of isVisible().
    await expect(
        page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station', exact: true })
    ).toBeVisible();

    await expect(
        page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station', exact: true })
    ).toBeVisible();
});
