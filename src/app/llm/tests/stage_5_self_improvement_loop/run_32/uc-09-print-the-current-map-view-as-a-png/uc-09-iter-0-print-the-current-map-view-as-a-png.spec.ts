// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: at least one base map and one overlay layer are visible.
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    const printToggle = page.getByTestId('print-toggle');
    await printToggle.click();

    // Verify the printing panel is visible.
    // The printing panel is identified by the "Print Map" button's accessible name.
    const printPanel = page.getByRole('dialog', { name: 'Print Map' });
    await expect(printPanel).toBeVisible();

    // Step 2: The user enters a title for the printout.
    const titleInput = printPanel.getByLabel('Title');
    await titleInput.fill('Test Printout');

    // Step 3: The user selects the PNG file format.
    // Locate the "Format" radio group and select the PNG option.
    const formatGroup = printPanel.getByRole('radiogroup', { name: 'Format' });
    await formatGroup.getByRole('radio', { name: 'PNG' }).click();

    // Step 4: The user clicks the export/print button.
    // Set up the download listener before triggering the action.
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        printPanel.getByRole('button', { name: 'Export' }).click(),
    ]);

    // Verify the downloaded file has a .png extension.
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/);
});
