// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: at least one base map and one overlay layer are visible.
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Open the printing panel.
    await page.getByRole('button', { name: 'Print Map' }).click();
    await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

    // Step 2: Enter a title for the printout.
    const titleInput = page.getByRole('textbox', { name: 'Title' });
    await titleInput.fill('Test Printout');

    // Step 3: Select the PNG file format.
    const formatCombobox = page.getByRole('combobox', { name: 'File format' });
    await formatCombobox.selectOption('png');

    // Step 4: Click the export/print button and wait for the download.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export map' }).click();

    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename().toLowerCase();

    // Expected result: a PNG file is generated and downloaded.
    expect(suggestedFilename.endsWith('.png')).toBe(true);
});
