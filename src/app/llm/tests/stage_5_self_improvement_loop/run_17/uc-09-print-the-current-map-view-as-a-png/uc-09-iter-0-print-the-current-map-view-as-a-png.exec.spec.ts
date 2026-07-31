// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for initial map state to settle (layers rendered, zoom stable)
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    const printToggle = page.getByRole('button', { name: 'Print Map' });
    await printToggle.click();

    // Step 2: The user enters a title for the printout.
    // The printing panel should be visible.
    const printPanel = page.getByRole('dialog', { name: /Print Map/i });
    await expect(printPanel).toBeVisible();

    const titleInput = page.getByLabel('Title');
    await titleInput.fill('Map Printout');

    // Step 3: The user selects the PNG file format.
    const formatSelect = page.getByLabel('Format');
    await formatSelect.selectOption('PNG');

    // Step 4: The user clicks the export/print button.
    // Prepare for the download
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /Print|Export/i }).click(),
    ]);

    // Expected results:
    // - A PNG file containing the current map view is generated and downloaded.
    // Verify the file was downloaded and has a .png extension
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    // Clean up the downloaded file
    await download.delete();
});
