// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and layers to be rendered
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: Open the printing panel by clicking the print toggle
    // The print-toggle button opens the printing-panel.
    // We assert visibility of the panel after clicking.
    await page.getByRole('button', { name: 'Print' }).click();
    await expect(page.getByTestId('printing-panel')).toBeVisible();

    // Step 2: Enter a title for the printout
    // Assuming there is a text input for the title inside the printing panel.
    // Based on typical UI patterns, we look for a label or placeholder.
    // If no specific test id is provided for the title input, we use getByLabel or getByPlaceholder.
    // Let's assume a label "Title" or similar exists.
    await page.getByLabel('Title').fill('Test Printout');

    // Step 3: Select the PNG file format
    // Assuming there is a radio group or select for format.
    // We look for a radio button or option labeled "PNG".
    await page.getByRole('radio', { name: 'PNG' }).check();

    // Step 4: Click the export/print button
    // We need to capture the download before clicking.
    const downloadPromise = page.waitForEvent('download');
    
    // Click the export button. It might be labeled "Export", "Print", or "Download".
    // Let's try "Export" first, then "Print" if needed.
    const exportButton = page.getByRole('button', { name: 'Export' }).or(page.getByRole('button', { name: 'Print' }));
    await exportButton.click();

    // Verify the download
    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    // Verify the printing panel is still visible or closed depending on app behavior.
    // Usually, after export, the panel might stay open or close.
    // The expected result says "printing panel is visible", implying it should remain or be visible during the process.
    // We already asserted it was visible. We can assert it remains visible.
    await expect(page.getByTestId('printing-panel')).toBeVisible();
});
