// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready (zoom level should be defined)
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Capture the initial map state to verify it's included in the print
    const initialZoom = await getMapZoomLevel(page);
    const initialCenter = await getMapCenter(page);

    // 1. Open the printing panel
    const printToggle = page.getByRole('button', { name: 'Print Map' });
    await printToggle.click();

    // 2. Enter a title for the printout
    // We expect a dialog/panel to appear with a title input.
    // Looking at the toolbar, the button is "Print Map".
    // We'll look for a dialog or panel with "Print" in the name.
    const printDialog = page.getByRole('dialog', { name: /Print/i });
    await expect(printDialog).toBeVisible();

    const titleInput = printDialog.getByLabel('Title');
    await titleInput.fill('Map Export Test');

    // 3. Select the PNG file format
    const formatSelect = printDialog.getByLabel('Format');
    await formatSelect.selectOption('png');

    // 4. Click the export/print button
    // We need to handle the file download.
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        printDialog.getByRole('button', { name: /Print|Export|Generate/i }).click()
    ]);

    // Verify the download
    expect(download.suggestedFilename()).toMatch(/\.png$/);
    
    // Clean up the download
    await download.delete();

    // Verify the printing panel is visible (it should remain open or show success)
    await expect(printDialog).toBeVisible();
});
