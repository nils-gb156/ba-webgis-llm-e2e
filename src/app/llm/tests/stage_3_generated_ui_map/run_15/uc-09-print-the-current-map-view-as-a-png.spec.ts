// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and verify preconditions
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    const printToggle = page.getByRole('button', { name: 'Print Map' }).or(page.getByTestId('print-toggle'));
    // Ensure the print toggle is not already active before clicking
    const isPrintActive = await printToggle.getAttribute('aria-pressed');
    if (isPrintActive !== 'true') {
        await printToggle.click();
    }

    // Step 2: The printing panel is visible.
    await expect(page.getByTestId('printing-panel')).toBeVisible();

    // Step 2: The user enters a title for the printout.
    const titleInput = page.getByTestId('printing').locator('input[type="text"]').or(page.getByLabel('Title'));
    if (await titleInput.isVisible()) {
        await titleInput.fill('Test Printout');
    }

    // Step 3: The user selects the PNG file format.
    // Try to find a radio button or dropdown for format selection
    const formatSelector = page.getByRole('radio', { name: 'PNG' }).or(page.getByRole('combobox', { name: /format/i }).or(page.getByTestId('printing').locator('select')));
    if (await formatSelector.isVisible()) {
        if (formatSelector.evaluate(el => el.tagName) === 'INPUT') {
             // It's a radio or checkbox
             if (await formatSelector.isChecked()) {
                 // Already selected, but ensure it's the one we want by checking name if ambiguous
                 // Assuming "PNG" radio is unique enough
             } else {
                 await formatSelector.click();
             }
        } else {
            // It's a select or combobox
            await formatSelector.selectOption({ label: 'PNG' });
        }
    } else {
        // Fallback: look for a button or link labeled PNG within the printing panel
        const pngButton = page.getByTestId('printing-panel').getByRole('button', { name: 'PNG' }).or(page.getByTestId('printing').getByRole('button', { name: 'PNG' }));
        if (await pngButton.isVisible()) {
            await pngButton.click();
        }
    }

    // Step 4: The user clicks the export/print button.
    // Set up download listener before triggering the action
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('printing').getByRole('button', { name: /export|print|download/i }).or(page.getByRole('button', { name: /export|print|download/i })).click()
    ]);

    // Expected results: A PNG file containing the current map view is generated and downloaded.
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/);

    // Verify the file was saved (optional but good practice for e2e)
    const path = await download.path();
    expect(path).toBeTruthy();
});
