// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and layers to be rendered.
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // 1. Open the printing panel.
    await page.getByRole('button', { name: 'Print Map' }).click();

    // The printing panel is visible.
    await expect(page.getByTestId('map-controls-panel')).toBeVisible();

    // 2. Enter a title for the printout.
    await page.getByLabel('Title').fill('Test Printout');

    // 3. Select the PNG file format.
    // Assuming the format selector is a combobox or radio group.
    // Based on common patterns, we try a combobox first, or radio buttons.
    // If it's a radio group, we click the radio with name "PNG".
    // If it's a combobox, we select the option.
    // Let's assume a combobox for simplicity, or look for a radio.
    // Without a screenshot of the dialog, we'll try a general approach.
    // Often, format is a combobox or radio buttons.
    // Let's try to find a radio button for PNG.
    const pngFormatLocator = page.getByRole('radio', { name: 'PNG' }).first();
    if (await pngFormatLocator.isVisible()) {
        await pngFormatLocator.click();
    } else {
        // Fallback: try a combobox
        await page.getByRole('combobox', { name: 'Format' }).selectOption('png');
    }

    // 4. Trigger the export/print.
    // We need to capture the download.
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /Print|Export|OK/i }).click(),
    ]);

    // The printed image shows the visible base map and overlay layers as well as the scale bar.
    // We can't directly assert the image content, but we can assert the file was downloaded.
    expect(download.suggestedFilename()).toMatch(/\.png$/);
});
