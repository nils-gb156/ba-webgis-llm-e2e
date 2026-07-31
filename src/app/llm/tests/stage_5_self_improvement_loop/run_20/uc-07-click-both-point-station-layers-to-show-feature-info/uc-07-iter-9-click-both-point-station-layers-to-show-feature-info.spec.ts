// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC-07 Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Precondition: No measurement tool is active
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
        await measurementToggle.click({ force: true });
    }

    // Step 1: Click on the map at the specified coordinates
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
        position: { x: 0, y: 0 },
        force: true,
    });

    // Step 2: Wait for the info panel to load the station info for both layers.
    // The click triggers a GetFeatureInfo request. We wait for the info panel
    // to display content for both station types.
    // Use exact: true to avoid matching the weather forecast section which also contains
    // "UV-Index" in the legend or other parts of the UI.
    await expect(page.getByTestId('info-panel')).toContainText('UV-Index Station', { exact: true });
    await expect(page.getByTestId('info-panel')).toContainText('EUCOS Ground Station', { exact: true });
});
