// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready (zoom level becomes defined)
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    await page.getByRole('button', { name: 'Print Map' }).click();

    // Verify the printing panel is visible
    await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

    // Step 2: The user enters a title for the printout.
    await page.getByRole('textbox', { name: 'Title' }).fill('Test Printout');

    // Step 3: The user selects the PNG file format.
    // The default is PDF, so we need to change it to PNG.
    await page.getByRole('combobox', { name: 'File format' }).selectOption('PNG');

    // Step 4: The user clicks the export/print button.
    // Start waiting for the download *before* triggering the action.
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export map' }).click()
    ]);

    // Verify the suggested filename has a PNG extension
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);
});
