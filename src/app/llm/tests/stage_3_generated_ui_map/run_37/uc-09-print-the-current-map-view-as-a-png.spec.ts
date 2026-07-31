// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition check: Ensure map is loaded with base layer and at least one operational layer
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    const printToggle = page.getByTestId('print-toggle');
    // Ensure the print panel is open. If it's already open (pressed), clicking it would close it.
    const isPrintPanelOpen = await page.getByTestId('printing-panel').isVisible();
    if (!isPrintPanelOpen) {
        await printToggle.click();
    }

    // Verify printing panel is visible
    await expect(page.getByTestId('printing-panel')).toBeVisible();

    // Step 2: The user enters a title for the printout.
    const titleInput = page.getByLabel('Title');
    await titleInput.fill('Test Printout');

    // Step 3: The user selects the PNG file format.
    const pngFormatRadio = page.getByRole('radio', { name: 'PNG' });
    if (!(await pngFormatRadio.isChecked())) {
        await pngFormatRadio.click();
    }

    // Step 4: The user clicks the export/print button.
    // Prepare for download
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /Print|Export|Generate/i }).click()
    ]);

    // Assert that a file was downloaded
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i, 'Downloaded file should be a PNG');

    // Clean up the downloaded file
    await download.delete();
});
