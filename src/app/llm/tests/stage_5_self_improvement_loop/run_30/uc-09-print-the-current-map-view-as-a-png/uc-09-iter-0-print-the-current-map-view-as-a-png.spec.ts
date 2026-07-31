// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: At least one base map and one overlay layer are visible
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: Open the printing panel
    const printToggle = page.getByTestId('print-toggle');
    await printToggle.click();

    // Expected result: The printing panel is visible
    await expect(printToggle).toBeChecked();

    // Step 2: Enter a title for the printout
    const titleInput = page.getByLabel('Title');
    await titleInput.fill('Test Print');

    // Step 3: Select the PNG file format
    const formatCheckbox = page.getByRole('checkbox', { name: 'PNG' });
    await formatCheckbox.click();

    // Step 4: Click the export/print button
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /Export|Print/i }).click(),
    ]);

    // Expected result: A PNG file is generated and downloaded
    expect(download.suggestedFilename()).toMatch(/\.png$/);
});
