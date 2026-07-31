// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for map to be ready and layers to be rendered
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

    // Step 1: Open the printing panel
    const printToggle = page.getByTestId('print-toggle');
    // Ensure print toggle is not already pressed (panel closed)
    const isPrintPressed = await printToggle.getAttribute('aria-pressed');
    if (isPrintPressed !== 'true') {
        await printToggle.click();
    }

    // Verify printing panel is visible
    await expect(page.getByTestId('printing-panel')).toBeVisible();

    // Step 2: Enter a title for the printout
    const titleInput = page.getByRole('textbox', { name: 'Title' });
    // The title input might be inside the printing panel, so we scope it if necessary,
    // but getByRole is usually sufficient if the name is unique.
    // If not unique, we might need to scope to the panel.
    // Assuming a standard label "Title" or similar.
    // Let's look for a more specific test id if available, but none is listed for title input.
    // We will try to find it by label.
    const titleField = page.getByRole('textbox', { name: 'Title' }).first();
    await titleField.fill('Test Printout');

    // Step 3: Select the PNG file format
    // We need to find the format selector. It's likely a radio group or select.
    // Looking for "PNG" option.
    const pngOption = page.getByRole('radio', { name: 'PNG' }).first();
    // Check if PNG is already selected
    const isPngSelected = await pngOption.isChecked();
    if (!isPngSelected) {
        await pngOption.click();
    }

    // Step 4: Click the export/print button
    const exportButton = page.getByRole('button', { name: 'Export' }).first();
    // Or maybe "Print" or "Download". Let's try "Export" first.
    // If "Export" is not found, try "Print".
    const exportBtn = exportButton || page.getByRole('button', { name: 'Print' }).first();

    // Wait for download event before clicking
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    // Verify download
    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);
});
