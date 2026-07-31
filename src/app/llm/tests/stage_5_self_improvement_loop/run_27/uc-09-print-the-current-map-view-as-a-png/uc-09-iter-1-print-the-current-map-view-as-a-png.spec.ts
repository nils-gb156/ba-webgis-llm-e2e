// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: base layer and overlay layers are visible
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    await page.getByRole('button', { name: 'Print Map' }).click();

    // The printing panel is visible
    await expect(page.getByRole('dialog', { name: 'Print Map' })).toBeVisible();

    // Step 2: The user enters a title for the printout.
    const titleInput = page.getByRole('textbox', { name: 'Title' });
    await titleInput.fill('Test Printout');

    // Step 3: The user selects the PNG file format.
    const formatSelect = page.getByRole('combobox', { name: 'File format' });
    await formatSelect.selectOption('PNG');

    // Step 4: The user clicks the export/print button.
    // Set up download listener before triggering the action
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export map' }).click(),
    ]);

    // Verify the file was downloaded and has the correct suggested filename
    expect(download.suggestedFilename()).toMatch(/test-printout\.png$/i);
});
