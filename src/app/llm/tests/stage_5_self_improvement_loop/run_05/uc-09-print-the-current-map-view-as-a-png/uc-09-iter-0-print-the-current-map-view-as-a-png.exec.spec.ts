// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: At least one base map and one overlay layer are visible
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    await page.getByTestId('print-toggle').click();

    // Expected result: The printing panel is visible.
    await expect(page.getByRole('dialog')).toBeVisible();

    // Step 2: The user enters a title for the printout.
    await page.getByLabel('Title').fill('My Map Printout');

    // Step 3: The user selects the PNG file format.
    await page.getByRole('radio', { name: 'PNG' }).click();

    // Step 4: The user clicks the export/print button.
    // The "Print" button inside the print dialog triggers a download.
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Print' }).click(),
    ]);

    // Expected result: A PNG file containing the current map view is generated and downloaded.
    expect(download.suggestedFilename()).toMatch(/\.png$/);
});
